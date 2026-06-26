import {
  getTrafficControlConfigForTenant,
  saveTrafficControlConfigForTenant,
} from '@/lib/traffic-control-config-repository';
import type { SaveTrafficControlConfigRequest } from '@/lib/traffic-control-config.types';
import { resolveTrafficApiAuthContext } from '@/app/api/traffic/_lib/auth-context';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authContext = await resolveTrafficApiAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const payload = await getTrafficControlConfigForTenant(authContext.tenantId);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load traffic control config',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await resolveTrafficApiAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const payload = (await request.json()) as SaveTrafficControlConfigRequest;
    if (!payload?.config) {
      return NextResponse.json(
        {
          error: 'config payload is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    const saved = await saveTrafficControlConfigForTenant(authContext.tenantId, payload);
    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to save traffic control config',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
