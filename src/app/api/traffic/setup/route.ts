import { getTrafficSetupBootstrap, saveTrafficSetup } from '@/lib/traffic-setup-repository';
import { validateTrafficSetupPayload } from '@/lib/traffic-setup-validation';
import type { SaveTrafficSetupRequest } from '@/lib/traffic-setup.types';
import { resolveTrafficApiAuthContext } from '@/app/api/traffic/_lib/auth-context';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authContext = await resolveTrafficApiAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const payload = await getTrafficSetupBootstrap({
      tenantId: authContext.tenantId,
      canManageCoverage: authContext.user?.role === 'superAdmin',
    });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load traffic setup',
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

    const payload = (await request.json()) as SaveTrafficSetupRequest;
    const validationError = validateTrafficSetupPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
          code: 'INVALID_INPUT',
        },
        { status: 400 },
      );
    }

    const saved = await saveTrafficSetup(authContext.tenantId, payload);
    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to save traffic setup',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
