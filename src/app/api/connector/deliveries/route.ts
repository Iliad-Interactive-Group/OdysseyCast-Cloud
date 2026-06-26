import { verifyConnectorToken } from '@/lib/connector-auth'
import { listPendingDeliveriesForTenant } from '@/lib/traffic-delivery-repository'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const connector = await verifyConnectorToken(request)
    if (!connector) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const deliveries = await listPendingDeliveriesForTenant(connector.tenantId)

    return NextResponse.json({ data: deliveries }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load deliveries',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    )
  }
}
