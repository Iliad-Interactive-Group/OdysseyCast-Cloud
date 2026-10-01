'use client';

import { runPromotionDecisioning } from '@/lib/promosync-deterministic-engine';
import type { PromoSyncBootstrapPayload } from '@/lib/promosync-bootstrap';
import { PROMOSYNC_ENTITY_ORDER, PROMOSYNC_SQL_SCHEMA } from '@/lib/sales-traffic-model';
import { authFetch } from '@iliad/auth';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@iliad/ui';
import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function PromoSyncSchemaPanel() {
  const [bootstrap, setBootstrap] = useState<PromoSyncBootstrapPayload | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedDaypartId, setSelectedDaypartId] = useState<string>('all-dayparts');
  const [selectedSeconds, setSelectedSeconds] = useState<15 | 30 | 60>(30);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBootstrap() {
      setLoadState('loading');

      try {
        const response = await authFetch('/api/promosync/bootstrap', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Traffic Logs bootstrap request failed');
        }

        const payload = (await response.json()) as PromoSyncBootstrapPayload;
        setBootstrap(payload);
        setLoadState('ready');
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setBootstrap(null);
        setLoadState('error');
      }
    }

    void loadBootstrap();

    return () => controller.abort();
  }, []);

  const stationOptions: string[] = useMemo((): string[] => {
    if (!bootstrap) {
      return [];
    }
    return [...new Set(bootstrap.inventorySlots.map((item) => item.stationId))];
  }, [bootstrap]);

  const daypartOptions: string[] = useMemo((): string[] => {
    if (!bootstrap) {
      return [];
    }
    return [...new Set(bootstrap.inventorySlots.map((item) => item.daypartId))];
  }, [bootstrap]);

  useEffect(() => {
    if (!stationOptions.includes(selectedStationId) && stationOptions[0]) {
      setSelectedStationId(stationOptions[0]);
    }
  }, [selectedStationId, stationOptions]);

  useEffect(() => {
    if (!daypartOptions.includes(selectedDaypartId) && daypartOptions[0]) {
      setSelectedDaypartId(daypartOptions[0]);
    }
  }, [daypartOptions, selectedDaypartId]);

  const decision = useMemo<ReturnType<typeof runPromotionDecisioning> | null>(() => {
    if (!bootstrap || !selectedStationId) {
      return null;
    }

    return runPromotionDecisioning({
      query: {
        tenantId: bootstrap.tenantId,
        stationIds: [selectedStationId],
        startDate: '2026-03-30',
        endDate: '2026-03-30',
        daypartIds: selectedDaypartId === 'all-dayparts' ? undefined : [selectedDaypartId],
        seconds: [selectedSeconds],
      },
      inventorySlots: bootstrap.inventorySlots,
      campaigns: bootstrap.campaigns,
      orderLines: bootstrap.orderLines,
      creativeAssets: bootstrap.creativeAssets,
      placementRules: bootstrap.placementRules,
    });
  }, [bootstrap, selectedDaypartId, selectedSeconds, selectedStationId]);

  if (!bootstrap && loadState !== 'loading') {
    return (
      <Card className="odyssey-panel border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-[0.16em]">
              traffic logs runtime
            </Badge>
          </div>
          <CardTitle className="text-xl">Traffic Logs Sales Traffic Core</CardTitle>
          <CardDescription>
            Unable to load tenant traffic logs data. Connect Firestore entities and refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Traffic logs bootstrap request failed.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="odyssey-panel border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-[0.16em]">
            deterministic schema
          </Badge>
          <Badge variant="outline">rules then ai</Badge>
          <Badge variant="outline">{bootstrap?.source ?? 'unavailable'}</Badge>
        </div>
        <CardTitle className="text-xl">Traffic Logs Sales Traffic Core</CardTitle>
        <CardDescription>
          Deterministic relational entities drive legal inventory and placement eligibility first.
          AI ranking only happens after legal options are computed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-border/60 bg-background/50 p-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="block text-xs uppercase tracking-[0.16em]">station</span>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              value={selectedStationId}
              onChange={(event) => setSelectedStationId(event.target.value)}
            >
              {stationOptions.map((stationId: string) => (
                <option key={stationId} value={stationId}>
                  {stationId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="block text-xs uppercase tracking-[0.16em]">daypart</span>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              value={selectedDaypartId}
              onChange={(event) => setSelectedDaypartId(event.target.value)}
            >
              <option value="all-dayparts">all-dayparts</option>
              {daypartOptions.map((daypartId: string) => (
                <option key={daypartId} value={daypartId}>
                  {daypartId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-muted-foreground">
            <span className="block text-xs uppercase tracking-[0.16em]">spot length</span>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              value={selectedSeconds}
              onChange={(event) => setSelectedSeconds(Number(event.target.value) as 15 | 30 | 60)}
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          source status: {loadState}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">entities</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {PROMOSYNC_ENTITY_ORDER.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Normalized operational tables in sequence.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              qualified slots
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {decision?.placementCandidates.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Slots passed deterministic checks in the current tenant run.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              blocked order lines
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {decision?.blockedOrderLines.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Order lines blocked before ranking.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <p className="text-sm font-medium text-foreground">Entity Order</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {PROMOSYNC_ENTITY_ORDER.join(' -> ')}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <p className="text-sm font-medium text-foreground">Top Placement Candidates</p>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {!(decision && decision.placementCandidates.length > 0) ? (
              <p className="rounded-lg border border-border/50 p-3">
                No legal candidates for current filter.
              </p>
            ) : null}

            {(decision?.placementCandidates ?? []).map((candidate) => (
              <div
                key={`${candidate.slotId}-${candidate.orderLineId}`}
                className="rounded-lg border border-border/50 p-3"
              >
                <p className="font-medium text-foreground">
                  {candidate.orderLineId} {'->'} {candidate.slotId} (score {candidate.score})
                </p>
                <p className="mt-1">{candidate.reasons.join(' | ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <p className="text-sm font-medium text-foreground">Availability Summary</p>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {!(decision && decision.availability.length > 0) ? (
              <p className="rounded-lg border border-border/50 p-3">
                No scoped availability found for this filter.
              </p>
            ) : null}

            {(decision?.availability ?? []).map((item) => (
              <div
                key={`${item.stationId}-${item.daypartId}`}
                className="rounded-lg border border-border/50 p-3"
              >
                <p className="font-medium text-foreground">
                  {item.stationId} / {item.daypartId}
                </p>
                <p className="mt-1">
                  open slots: {item.openSlots}, open seconds: {item.openSeconds}, confidence:{' '}
                  {item.confidence}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <p className="text-sm font-medium text-foreground">SQL Schema Snapshot</p>
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
            {PROMOSYNC_SQL_SCHEMA.trim()}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
