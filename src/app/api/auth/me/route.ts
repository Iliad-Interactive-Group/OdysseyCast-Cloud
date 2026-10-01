import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  return NextResponse.json({
    uid: authUser.uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    role: authUser.role,
    tenantId: authUser.tenantId,
    tenantIds: authUser.tenantIds,
  });
}
