import { approveCoverageCandidate } from '@/lib/traffic-setup-repository';
import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

interface ApproveRouteParams {
  params: Promise<{
    candidateId: string;
  }>;
}

export async function POST(request: NextRequest, context: ApproveRouteParams) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser?.uid || authUser.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const { candidateId } = await context.params;
    if (!candidateId?.trim()) {
      return NextResponse.json(
        { error: 'candidateId is required', code: 'INVALID_INPUT' },
        { status: 400 },
      );
    }

    const approved = await approveCoverageCandidate({
      candidateId,
      approvedBy: authUser.uid,
    });

    return NextResponse.json(approved, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to approve coverage candidate',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
