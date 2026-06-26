import { getTrafficSetupConfigForTenant } from '@/lib/traffic-setup-repository';
import { resolveTrafficTomTomApiKey } from '@/lib/traffic-env';
import { resolveTrafficApiAuthContext } from '@/app/api/traffic/_lib/auth-context';
import { NextRequest, NextResponse } from 'next/server';

const MARKET_BBOX: Record<string, string> = {
  'boise-id': '-116.30,43.48,-116.02,43.69',
  'dallas-tx': '-97.11,32.62,-96.52,33.03',
  'phoenix-az': '-112.32,33.20,-111.93,33.66',
};

interface TomTomHealthResponse {
  ok: boolean;
  provider: 'tomtom-live' | 'tomtom-fallback';
  summary: string;
  incidentCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await resolveTrafficApiAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const setup = await getTrafficSetupConfigForTenant(authContext.tenantId);
    if (!setup) {
      return NextResponse.json(
        { error: 'Traffic setup must be saved before testing TomTom connectivity' },
        { status: 400 },
      );
    }

    const apiKey = resolveTrafficTomTomApiKey();
    if (!apiKey) {
      const payload: TomTomHealthResponse = {
        ok: false,
        provider: 'tomtom-fallback',
        summary:
          'TomTom key missing. Configure TOMTOM_API_KEY or ODYSSEYCAST_TOMTOM_KEY to enable live traffic pulls.',
        incidentCount: 0,
      };
      return NextResponse.json(payload, { status: 200 });
    }

    const bbox = MARKET_BBOX[setup.marketId];
    if (!bbox) {
      const payload: TomTomHealthResponse = {
        ok: false,
        provider: 'tomtom-fallback',
        summary: `No market bbox mapping is configured for ${setup.marketId}.`,
        incidentCount: 0,
      };
      return NextResponse.json(payload, { status: 200 });
    }

    const params = new URLSearchParams({
      bbox,
      fields:
        '{incidents{type,properties{from,to,roadNumbers,events{description},delay,magnitudeOfDelay}}}',
      language: 'en-US',
      timeValidityFilter: 'present',
      key: apiKey,
    });

    const response = await fetch(
      `https://api.tomtom.com/traffic/services/5/incidentDetails?${params.toString()}`,
    );

    if (!response.ok) {
      const payload: TomTomHealthResponse = {
        ok: false,
        provider: 'tomtom-fallback',
        summary: `TomTom request failed (${response.status}).`,
        incidentCount: 0,
      };
      return NextResponse.json(payload, { status: 200 });
    }

    const data = (await response.json()) as {
      incidents?: Array<unknown>;
    };

    const incidentCount = data.incidents?.length ?? 0;
    const payload: TomTomHealthResponse = {
      ok: true,
      provider: 'tomtom-live',
      summary: `TomTom live pull succeeded for ${setup.marketId}.`,
      incidentCount,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to test TomTom connectivity',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
