import { verifyConnectorToken } from '@/lib/connector-auth'
import { acknowledgeDelivery } from '@/lib/traffic-delivery-repository'
import { NextRequest, NextResponse } from 'next/server'

interface ConnectorAcknowledgePayload {
  deliveryId?: string
  status?: 'delivered' | 'failed'
  errorMessage?: string
}

export async function POST(request: NextRequest) {
  try {
    const connector = await verifyConnectorToken(request)
    if (!connector) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const payload = (await request.json()) as ConnectorAcknowledgePayload

    if (!payload.deliveryId || !payload.status) {
      return NextResponse.json(
        { error: 'deliveryId and status are required', code: 'INVALID_INPUT' },
        { status: 400 },
      )
    }

    if (payload.status !== 'delivered' && payload.status !== 'failed') {
      return NextResponse.json(
        { error: 'status must be delivered or failed', code: 'INVALID_INPUT' },
        { status: 400 },
      )
    }

    const delivery = await acknowledgeDelivery({
      tenantId: connector.tenantId,
      deliveryId: payload.deliveryId,
      status: payload.status,
      errorMessage: payload.errorMessage,
    })

    return NextResponse.json({ data: delivery }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to acknowledge delivery',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    )
  }
}
