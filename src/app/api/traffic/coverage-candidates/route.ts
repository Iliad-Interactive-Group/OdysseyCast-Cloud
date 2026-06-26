import { createCoverageCandidate } from '@/lib/traffic-setup-repository';
import { validateCoverageCandidatePayload } from '@/lib/traffic-setup-validation';
import type { CreateCoverageCandidateRequest } from '@/lib/traffic-setup.types';
import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser?.uid || authUser.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const payload = (await request.json()) as CreateCoverageCandidateRequest;
    const validationError = validateCoverageCandidatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError, code: 'INVALID_INPUT' }, { status: 400 });
    }

    const created = await createCoverageCandidate({
      payload,
      createdBy: authUser.uid,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to create coverage candidate',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
