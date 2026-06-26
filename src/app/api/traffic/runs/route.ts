import { listTrafficRuns } from '@/lib/traffic-run-repository';
import type { TrafficRunListResponse } from '@/lib/traffic-runtime.types';
import { resolveTrafficApiAuthContext } from '@/app/api/traffic/_lib/auth-context';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authContext = await resolveTrafficApiAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const runs = await listTrafficRuns(authContext.tenantId);
    const payload: TrafficRunListResponse = { runs };

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load traffic runs',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
