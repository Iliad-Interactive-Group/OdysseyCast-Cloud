'use client';

import type { TrafficRunListResponse } from '@/lib/traffic-runtime.types';
import { getIdToken } from '@iliad/auth';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@iliad/ui';
import { Activity, AlertCircle, CheckCircle2, Loader2, RadioTower } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

async function withTenantAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const token = await Promise.race<string | null>([
    getIdToken().catch(() => null),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), 800);
    }),
  ]);
  const headers = new Headers(init?.headers ?? {});
  const tenantContextId =
    typeof window !== 'undefined'
      ? (window.localStorage.getItem('odyssey-tenant-context') ?? 'iig-core')
      : null;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (tenantContextId) {
    headers.set('x-odyssey-tenant-context', tenantContextId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export function PeteyControlCenter() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slotCount, setSlotCount] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);

  useEffect(() => {
    async function loadOperationalState() {
      setIsLoading(true);
      setError(null);

      try {
        const [setupResponse, runsResponse] = await Promise.all([
          withTenantAuth('/api/traffic/setup'),
          withTenantAuth('/api/traffic/runs'),
        ]);

        if (!setupResponse.ok || !runsResponse.ok) {
          throw new Error('Unable to load operational status');
        }

        const setupPayload = (await setupResponse.json()) as {
          config: { slotTimes?: string[] } | null;
        };
        const runsPayload = (await runsResponse.json()) as TrafficRunListResponse;

        const runs = runsPayload.runs ?? [];
        setSlotCount(setupPayload.config?.slotTimes?.length ?? 0);
        setRunCount(runs.length);
        setDeliveredCount(runs.filter((run) => run.deliveryState === 'delivered').length);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load status');
      } finally {
        setIsLoading(false);
      }
    }

    void loadOperationalState();
  }, []);

  const successRate = useMemo(() => {
    if (runCount === 0) {
      return '0%';
    }

    return `${Math.round((deliveredCount / runCount) * 100)}%`;
  }, [deliveredCount, runCount]);

  return (
    <Card className="odyssey-panel border-primary/30">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-[0.16em]">
            live operations
          </Badge>
          <Badge variant="outline">tenant-scoped</Badge>
          <Badge variant="outline">real runtime</Badge>
        </div>
        <div>
          <CardTitle className="text-xl">Petey Ops Console</CardTitle>
          <CardDescription>
            Monitor live runtime posture and jump directly into working production tools.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              configured slots
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{slotCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Traffic schedule slots ready to run.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              traffic runs
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{runCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generated runs recorded for this tenant.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              delivery success
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{successRate}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Delivered runs vs total generated runs.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading operational status...
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <RadioTower className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Run traffic operations</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure slots, approve candidates, and generate report runs from the traffic desk.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/traffic">Open Traffic Desk</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/traffic?view=setup">Open Setup</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Workspaces</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Jump between active OdysseyCast modules without roadmap or planning overlays.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/traffic-logs">Traffic Logs</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/voice-tracker-pro">Voice Tracker</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/audio-playground">Audio Playground</Link>
              </Button>
            </div>
          </div>
        </div>

        {!error && !isLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Live runtime loaded. Control center is now reading actual tenant operations data.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
