import { isLocalOnlyRequest } from '@/lib/local-request-guard';
import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_AUTOMATION_ADMIN_BASE_URL = 'http://127.0.0.1:5179';

function getAutomationAdminBaseUrl() {
  const configured = process.env.ODYSSEY_AUTOMATION_LOCAL_ADMIN_BASE_URL?.trim();
  const value = configured && configured.length > 0 ? configured : DEFAULT_AUTOMATION_ADMIN_BASE_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildJsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function isLocalAdminEnabled(): boolean {
  return process.env.ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED === 'true';
}

async function proxyToAutomationAdmin(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const authUser = await verifyAuthToken(request);
  if (!authUser?.tenantId) {
    return buildJsonError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  if (process.env.NODE_ENV === 'production') {
    return buildJsonError('Local admin APIs are disabled in production.', 403, 'LOCAL_ONLY_ADMIN');
  }

  if (!isLocalAdminEnabled()) {
    return buildJsonError(
      'Local admin proxy is disabled. Set ODYSSEY_AUTOMATION_LOCAL_ADMIN_ENABLED=true for local development.',
      404,
      'LOCAL_ADMIN_DISABLED',
    );
  }

  if (!isLocalOnlyRequest(request)) {
    return buildJsonError('Local admin APIs are loopback-only.', 403, 'LOCAL_ONLY_ADMIN');
  }

  const { path = [] } = await context.params;
  if (path.length === 0) {
    return buildJsonError('Route not found for Automation local admin API', 404, 'NOT_FOUND');
  }

  const upstreamPath = path.join('/');
  const upstreamUrl = new URL(`${getAutomationAdminBaseUrl()}/${upstreamPath}`);
  const incomingUrl = new URL(request.url);
  incomingUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      'x-odyssey-tenant-id': authUser.tenantId,
      ...(authUser.email ? { 'x-odyssey-user-email': authUser.email } : {}),
      ...(request.headers.get('content-type')
        ? { 'content-type': request.headers.get('content-type') as string }
        : {}),
    },
    body,
    cache: 'no-store',
  });

  const responseBody = await upstreamResponse.arrayBuffer();
  const contentType = upstreamResponse.headers.get('content-type') || 'application/json';

  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: {
      'content-type': contentType,
    },
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAutomationAdmin(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToAutomationAdmin(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAutomationAdmin(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToAutomationAdmin(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToAutomationAdmin(request, context);
}
