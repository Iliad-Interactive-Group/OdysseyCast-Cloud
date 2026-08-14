import { isLocalOnlyRequest } from '@/lib/local-request-guard';
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

  if (process.env.NODE_ENV === 'production') {
    return buildJsonError('Local admin APIs are disabled in production.', 403, 'LOCAL_ONLY_ADMIN');
  }

  if (process.env.ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED !== 'true') {
    return buildJsonError(
      'Local admin proxy is disabled. Set ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED=true for local development.',
      404,
      'LOCAL_ADMIN_DISABLED',
    );
  }

  if (!isLocalOnlyRequest(request)) {
    return buildJsonError('Local admin APIs are loopback-only.', 403, 'LOCAL_ONLY_ADMIN');
  }

  return NextResponse.json({
    module: 'odysseycast-automation',
    message: 'Local admin proxy is active for loopback traffic only.',
    runtimePathPattern: '/api/automation/admin/{path}',
  });
}
