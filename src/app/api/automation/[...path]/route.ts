import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_AUTOMATION_RUNTIME_BASE_URL = 'http://127.0.0.1:5179';

function getAutomationRuntimeBaseUrl() {
  const configured = process.env.ODYSSEY_AUTOMATION_RUNTIME_API_BASE_URL?.trim();
  const value = configured && configured.length > 0 ? configured : DEFAULT_AUTOMATION_RUNTIME_BASE_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildJsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

async function proxyToAutomation(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const authUser = await verifyAuthToken(request);
  if (!authUser?.tenantId) {
    return buildJsonError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const { path = [] } = await context.params;
  if (path.length === 0) {
    return buildJsonError('Route not found for Automation API', 404, 'NOT_FOUND');
  }

  const upstreamPath = path.join('/');
  const upstreamUrl = new URL(`${getAutomationRuntimeBaseUrl()}/${upstreamPath}`);
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
  return proxyToAutomation(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToAutomation(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxyToAutomation(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToAutomation(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToAutomation(request, context);
}
