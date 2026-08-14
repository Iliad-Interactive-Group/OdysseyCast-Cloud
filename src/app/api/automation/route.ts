import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

function buildJsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET(request: NextRequest) {
  const authUser = await verifyAuthToken(request);
  if (!authUser?.tenantId) {
    return buildJsonError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return NextResponse.json({
    module: 'odysseycast-automation',
    runtimeApi: '/api/automation/{path}',
    localAdminApi: '/api/automation/admin/{path}',
    localAdminEnabled: process.env.ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED === 'true',
  });
}
