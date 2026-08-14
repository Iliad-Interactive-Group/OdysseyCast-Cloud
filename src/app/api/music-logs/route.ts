import { proxyApolloMusicApi } from '@/lib/apollo-music-service';
import { verifyAuthToken } from '@iliad/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const response = await proxyApolloMusicApi({
      method: 'GET',
      path: 'day',
      query: new URL(request.url).searchParams,
      tenantId: authUser.tenantId,
      userEmail: authUser.email,
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load music log day state',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
