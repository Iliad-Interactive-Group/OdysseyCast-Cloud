import { getOdysseyCastApiUrl } from '@/lib/odysseycast-api';
import { NextRequest, NextResponse } from 'next/server';

// Server-side relay to OdysseyCast-Cloud-API's portal routes. The caller's iig-core
// ID token is forwarded as-is: Cloud-API verifies it and resolves tenant/role from
// its own D1 memberships, so no second auth table is kept here.

function buildJsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

async function proxyToCloudApi(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return buildJsonError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const { path = [] } = await context.params;
  if (path.length === 0) {
    return buildJsonError('Route not found for Cloud API', 404, 'NOT_FOUND');
  }

  const upstreamUrl = new URL(`${getOdysseyCastApiUrl()}/v1/portal/${path.join('/')}`);
  new URL(request.url).searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const contentType = request.headers.get('content-type');

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      authorization,
      ...(contentType ? { 'content-type': contentType } : {}),
    },
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: 'no-store',
  });

  return new NextResponse(await upstreamResponse.arrayBuffer(), {
    status: upstreamResponse.status,
    headers: {
      'content-type': upstreamResponse.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = proxyToCloudApi;
export const POST = proxyToCloudApi;
export const PUT = proxyToCloudApi;
export const PATCH = proxyToCloudApi;
export const DELETE = proxyToCloudApi;
