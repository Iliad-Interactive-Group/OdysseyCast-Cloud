import 'server-only';

const DEFAULT_APOLLO_BASE_URL = 'http://127.0.0.1:8090';

type ApolloMethod = 'GET' | 'POST';

interface ApolloProxyRequest {
  method: ApolloMethod;
  path: string;
  query?: URLSearchParams;
  body?: unknown;
  tenantId: string;
  userEmail?: string;
}

let cachedSessionCookie: string | null = null;

function getApolloBaseUrl(): string {
  const base = process.env.APOLLO_MUSIC_SCHEDULER_BASE_URL?.trim() || DEFAULT_APOLLO_BASE_URL;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function getApolloCredentials(): { email: string; password: string } {
  const email = process.env.APOLLO_MUSIC_SCHEDULER_EMAIL?.trim();
  const password = process.env.APOLLO_MUSIC_SCHEDULER_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error(
      'Apollo credentials are not configured. Set APOLLO_MUSIC_SCHEDULER_EMAIL and APOLLO_MUSIC_SCHEDULER_PASSWORD.',
    );
  }

  return { email, password };
}

function extractApolloSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/apollo_session=[^;]+/i);
  return match ? match[0] : null;
}

async function loginApolloServiceAccount(): Promise<string> {
  const { email, password } = getApolloCredentials();
  const response = await fetch(`${getApolloBaseUrl()}/api/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password, remember: true }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Apollo login failed (${response.status}): ${detail || 'Unknown error'}`);
  }

  const sessionCookie = extractApolloSessionCookie(response.headers.get('set-cookie'));
  if (!sessionCookie) {
    throw new Error('Apollo login succeeded but did not return an apollo_session cookie.');
  }

  cachedSessionCookie = sessionCookie;
  return sessionCookie;
}

async function getApolloSessionCookie(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedSessionCookie) {
    return cachedSessionCookie;
  }

  return loginApolloServiceAccount();
}

function buildApolloUrl(path: string, query?: URLSearchParams): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(`${getApolloBaseUrl()}/api/${normalizedPath}`);

  if (query) {
    query.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

async function callApollo(
  request: ApolloProxyRequest,
  sessionCookie: string,
): Promise<Response> {
  const url = buildApolloUrl(request.path, request.query);
  const headers: Record<string, string> = {
    cookie: sessionCookie,
    'x-odyssey-tenant-id': request.tenantId,
  };

  if (request.userEmail) {
    headers['x-odyssey-user-email'] = request.userEmail;
  }

  if (request.body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  return fetch(url, {
    method: request.method,
    headers,
    body: request.body !== undefined ? JSON.stringify(request.body) : undefined,
    cache: 'no-store',
  });
}

export async function proxyApolloMusicApi(request: ApolloProxyRequest): Promise<Response> {
  const sessionCookie = await getApolloSessionCookie(false);
  let response = await callApollo(request, sessionCookie);

  if (response.status !== 401) {
    return response;
  }

  const refreshedCookie = await getApolloSessionCookie(true);
  response = await callApollo(request, refreshedCookie);
  return response;
}
