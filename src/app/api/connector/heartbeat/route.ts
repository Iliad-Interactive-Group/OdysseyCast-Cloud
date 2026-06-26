import { verifyConnectorToken } from '@/lib/connector-auth'
import { getFirestoreAdmin } from '@iliad/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface HeartbeatPayload {
  version?: string
  status?: 'online' | 'offline' | 'error'
  outputFolder?: string
}

const COLLECTIONS = {
  connectors: 'connectors',
}

export async function POST(request: NextRequest) {
  try {
    const connector = await verifyConnectorToken(request)
    if (!connector) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const payload = (await request.json()) as HeartbeatPayload

    const db = getFirestoreAdmin()
    const nowIso = new Date().toISOString()

    await db.collection(COLLECTIONS.connectors).doc(connector.connectorId).set(
      {
        tenantId: connector.tenantId,
        connectorId: connector.connectorId,
        version: payload.version || 'unknown',
        status: payload.status || 'online',
        outputFolder: payload.outputFolder || '',
        lastSeenAtIso: nowIso,
        updatedAtIso: nowIso,
      },
      { merge: true },
    )

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to process heartbeat',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    )
  }
}
