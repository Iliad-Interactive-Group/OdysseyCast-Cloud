import { generateTrafficRun } from '@/lib/traffic-run-repository';
import type { GenerateTrafficRunRequest } from '@/lib/traffic-runtime.types';
import { validateGenerateTrafficRunPayload } from '@/lib/traffic-setup-validation';
import { resolveTrafficApiAuthContext } from '@/app/api/traffic/_lib/auth-context';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authContext = await resolveTrafficApiAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const payload = (await request.json()) as GenerateTrafficRunRequest;
    const validationError = validateGenerateTrafficRunPayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError, code: 'INVALID_INPUT' }, { status: 400 });
    }

    const run = await generateTrafficRun(authContext.tenantId, payload);
    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to generate traffic run',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
