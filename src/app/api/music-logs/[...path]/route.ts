import { proxyApolloMusicApi } from '@/lib/apollo-music-service';
import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_GET_PATTERNS = [
  /^day$/,
  /^dashboard$/,
  /^rules$/,
  /^library$/,
  /^candidates\/\d+$/,
  /^song-history\/[^/]+$/,
];

const ALLOWED_POST_PATTERNS = [
  /^edit$/,
  /^move$/,
  /^move-check$/,
  /^regenerate$/,
  /^rules$/,
  /^library\/add$/,
  /^library\/override$/,
  /^feature-block$/,
];

function isAllowedPath(method: string, path: string): boolean {
  const patterns = method === 'GET' ? ALLOWED_GET_PATTERNS : ALLOWED_POST_PATTERNS;
  return patterns.some((pattern) => pattern.test(path));
}

function mapPathToApollo(path: string): string {
  return path
    .replace(/^song-history\//, 'song_history/')
    .replace(/^move-check$/, 'move_check')
    .replace(/^feature-block$/, 'feature_block');
}

function buildJsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

async function handleProxy(
  request: NextRequest,
  params: { path?: string[] },
  method: 'GET' | 'POST',
) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser?.tenantId) {
      return buildJsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const incomingPath = (params.path || []).join('/').trim();
    if (!incomingPath || !isAllowedPath(method, incomingPath)) {
      return buildJsonError('Route not found for Music Logs API', 404, 'NOT_FOUND');
    }

    const apolloPath = mapPathToApollo(incomingPath);
    const query = new URL(request.url).searchParams;
    const body = method === 'POST' ? await request.json() : undefined;

    const response = await proxyApolloMusicApi({
      method,
      path: apolloPath,
      query,
      body,
      tenantId: authUser.tenantId,
      userEmail: authUser.email,
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return NextResponse.json(json, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': contentType },
    });
  } catch (error) {
    return buildJsonError(
      error instanceof Error ? error.message : 'Unable to proxy Music Logs request',
      500,
      'INTERNAL_ERROR',
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params;
  return handleProxy(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params;
  return handleProxy(request, params, 'POST');
}
