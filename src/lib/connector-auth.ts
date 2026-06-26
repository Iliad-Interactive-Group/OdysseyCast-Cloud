import 'server-only'

import { getFirestoreAdmin } from '@iliad/firebase/admin'
import { NextRequest } from 'next/server'

interface ConnectorTokenDoc {
  token: string
  tenantId: string
  connectorId?: string
  expiresAt?: string
  isRevoked?: boolean
}

export interface ConnectorAuthContext {
  tenantId: string
  connectorId: string
}

const COLLECTIONS = {
  connectorTokens: 'connectorTokens',
}

export async function verifyConnectorToken(
  request: NextRequest,
): Promise<ConnectorAuthContext | null> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return null
  }

  const db = getFirestoreAdmin()
  const snapshot = await db
    .collection(COLLECTIONS.connectorTokens)
    .where('token', '==', token)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const record = doc.data() as ConnectorTokenDoc

  if (record.isRevoked) {
    return null
  }

  if (record.expiresAt) {
    const expiresAtMs = Date.parse(record.expiresAt)
    if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
      return null
    }
  }

  return {
    tenantId: record.tenantId,
    connectorId: record.connectorId || doc.id,
  }
}
