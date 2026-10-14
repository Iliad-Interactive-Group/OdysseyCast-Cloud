import { NextRequest, NextResponse } from 'next/server';
import { getPromoSyncBootstrapPayload } from '@/lib/promosync-repository';
import { verifyAuthToken } from '@iliad/auth/middleware';
import { reportServerError } from '@/lib/control-plane';

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const tenantId = authUser.tenantId;
    const payload = await getPromoSyncBootstrapPayload(tenantId);
    return NextResponse.json(payload);
  } catch (error) {
    void reportServerError(error, { route: '/api/promosync/bootstrap' });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to load Traffic Logs bootstrap data',
      },
      { status: 500 },
    );
  }
}
