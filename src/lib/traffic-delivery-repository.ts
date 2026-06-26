import 'server-only'

import type { TrafficDeliveryJob } from '@/lib/traffic-runtime.types'
import { getFirestoreAdmin } from '@iliad/firebase/admin'

const COLLECTIONS = {
  deliveries: 'deliveries',
}

type DeliveryDoc = Omit<TrafficDeliveryJob, 'id'>

function mapDelivery(id: string, value: DeliveryDoc): TrafficDeliveryJob {
  return {
    id,
    ...value,
  }
}

export async function enqueueTrafficDeliveryJob(params: {
  tenantId: string
  audioUrl: string
  cartName: string
  slotTime: string
}): Promise<TrafficDeliveryJob> {
  const nowIso = new Date().toISOString()

  const next: DeliveryDoc = {
    tenantId: params.tenantId,
    service: 'traffic',
    audioUrl: params.audioUrl,
    cartName: params.cartName,
    slotTime: params.slotTime,
    status: 'pending',
    attempts: 0,
    generatedAtIso: nowIso,
  }

  const db = getFirestoreAdmin()
  const ref = await db.collection(COLLECTIONS.deliveries).add(next)

  return mapDelivery(ref.id, next)
}

export async function listPendingDeliveriesForTenant(tenantId: string): Promise<TrafficDeliveryJob[]> {
  const db = getFirestoreAdmin()
  const snapshot = await db
    .collection(COLLECTIONS.deliveries)
    .where('tenantId', '==', tenantId)
    .where('status', '==', 'pending')
    .orderBy('generatedAtIso', 'asc')
    .limit(50)
    .get()

  return snapshot.docs.map((doc) => mapDelivery(doc.id, doc.data() as DeliveryDoc))
}

export async function acknowledgeDelivery(params: {
  tenantId: string
  deliveryId: string
  status: 'delivered' | 'failed'
  errorMessage?: string
}): Promise<TrafficDeliveryJob> {
  const db = getFirestoreAdmin()
  const ref = db.collection(COLLECTIONS.deliveries).doc(params.deliveryId)

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      throw new Error('Delivery not found')
    }

    const current = snap.data() as DeliveryDoc
    if (current.tenantId !== params.tenantId) {
      throw new Error('Forbidden')
    }

    const nowIso = new Date().toISOString()
    const patch: Partial<DeliveryDoc> = {
      status: params.status,
      attempts: (current.attempts ?? 0) + 1,
      deliveredAtIso: params.status === 'delivered' ? nowIso : current.deliveredAtIso,
      failedAtIso: params.status === 'failed' ? nowIso : current.failedAtIso,
      lastError:
        params.status === 'failed'
          ? params.errorMessage?.trim() || 'Connector delivery failed'
          : undefined,
    }

    tx.set(ref, patch, { merge: true })

    return {
      ...current,
      ...patch,
    } as DeliveryDoc
  })

  return mapDelivery(ref.id, next)
}
