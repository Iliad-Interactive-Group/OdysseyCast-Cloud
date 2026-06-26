'use client';

import { isValidSlot } from '@/lib/traffic-schedule';
import { TrafficControlConfigEditor } from '@/components/workspace/traffic-control-config-editor';
import type {
  SaveTrafficControlConfigRequest,
  TrafficControlCart,
  TrafficControlConfig,
} from '@/lib/traffic-control-config.types';
import type { TrafficRun, TrafficRunListResponse } from '@/lib/traffic-runtime.types';
import type {
  CreateCoverageCandidateRequest,
  GenerateTrafficRunRequest,
  SaveTrafficSetupRequest,
  TrafficCoverageCandidate,
  TrafficSetupBootstrap,
  TrafficSetupConfig,
} from '@/lib/traffic-setup.types';
import { getIdToken } from '@iliad/auth';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@iliad/ui';
import { AlertCircle, Check, CheckCircle2, Clock3, Loader2, PlusCircle, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface TrafficControlCenterProps {
  activeViewId: string;
}

interface SetupFormState {
  marketId: string;
  clusterName: string;
  automationSystem: string;
  segmentLabel: string;
  slotTimesText: string;
}

interface CoverageCandidateFormState {
  name: string;
  state: string;
  timezone: string;
}

interface TomTomHealthCheck {
  ok: boolean;
  provider: 'tomtom-live' | 'tomtom-fallback';
  summary: string;
  incidentCount: number;
}

type TrafficControlDraft = SaveTrafficControlConfigRequest['config'];

const RUN_STATUS_LABELS: Record<TrafficRun['status'], string> = {
  generated: 'Generated',
  delivered: 'Delivered',
  failed: 'Failed',
};

const DELIVERY_STATE_LABELS: Record<TrafficRun['deliveryState'], string> = {
  'not-queued': 'Not queued',
  queued: 'Queued',
  delivered: 'Delivered',
  failed: 'Delivery failed',
};

function createDefaultState(): SetupFormState {
  return {
    marketId: '',
    clusterName: '',
    automationSystem: 'WideOrbit',
    segmentLabel: 'Morning Drive',
    slotTimesText: '',
  };
}

function createDefaultCoverageCandidateState(): CoverageCandidateFormState {
  return {
    name: '',
    state: '',
    timezone: 'America/Chicago',
  };
}

function createFallbackBootstrap(): TrafficSetupBootstrap {
  return {
    tenantId: '',
    availableMarkets: [],
    config: null,
    suggestedSlotTimes: ['06:10', '16:10'],
    canManageCoverage: false,
    coverageCandidates: [],
  };
}

function toSlotLines(slotTimes: string[]): string {
  return slotTimes.join('\n');
}

function parseSlotLines(input: string): string[] {
  return input
    .split(/[,\n]/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function toMinutes(value: string): number | null {
  if (!isValidSlot(value)) {
    return null;
  }

  const [hour, minute] = value.split(':').map((segment) => Number(segment));
  return hour * 60 + minute;
}

function isWithinWindow(params: { slotTime: string; startTime: string; endTime: string }): boolean {
  const slot = toMinutes(params.slotTime);
  const start = toMinutes(params.startTime);
  const end = toMinutes(params.endTime);

  if (slot === null || start === null || end === null) {
    return false;
  }

  if (end < start) {
    return slot >= start || slot <= end;
  }

  return slot >= start && slot <= end;
}

function findCartForSlot(slotTime: string, carts: TrafficControlCart[]): TrafficControlCart | null {
  return (
    carts.find((cart) =>
      isWithinWindow({ slotTime, startTime: cart.startTime, endTime: cart.endTime }),
    ) ?? null
  );
}

function createDefaultControlConfigDraft(): TrafficControlDraft {
  return {
    carts: [],
    commutes: [],
    voices: [],
    replacements: [],
    pronunciations: [],
    prompts: {
      consolidateAndSummarize: '',
      generateTrafficNarrative: '',
      createBroadcastScript: '',
      generateSsml: '',
    },
    scheduler: {
      minutesBetweenRuns: 10,
      isAutomationRunning: false,
      useCache: false,
      skipFirstRunOnStartup: true,
    },
  };
}

function toControlConfigDraft(input: unknown): TrafficControlDraft {
  if (!input || typeof input !== 'object') {
    return createDefaultControlConfigDraft();
  }

  const parsed = input as Partial<TrafficControlConfig> & { config?: Partial<TrafficControlDraft> };
  const source = parsed.config ?? parsed;
  const defaults = createDefaultControlConfigDraft();

  return {
    carts: source.carts ?? defaults.carts,
    commutes: source.commutes ?? defaults.commutes,
    voices: source.voices ?? defaults.voices,
    replacements: source.replacements ?? defaults.replacements,
    pronunciations: source.pronunciations ?? defaults.pronunciations,
    prompts: {
      consolidateAndSummarize:
        source.prompts?.consolidateAndSummarize ?? defaults.prompts.consolidateAndSummarize,
      generateTrafficNarrative:
        source.prompts?.generateTrafficNarrative ?? defaults.prompts.generateTrafficNarrative,
      createBroadcastScript:
        source.prompts?.createBroadcastScript ?? defaults.prompts.createBroadcastScript,
      generateSsml: source.prompts?.generateSsml ?? defaults.prompts.generateSsml,
    },
    scheduler: {
      minutesBetweenRuns:
        source.scheduler?.minutesBetweenRuns ?? defaults.scheduler.minutesBetweenRuns,
      isAutomationRunning:
        source.scheduler?.isAutomationRunning ?? defaults.scheduler.isAutomationRunning,
      useCache: source.scheduler?.useCache ?? defaults.scheduler.useCache,
      skipFirstRunOnStartup:
        source.scheduler?.skipFirstRunOnStartup ?? defaults.scheduler.skipFirstRunOnStartup,
    },
  };
}

function hydrateForm(
  config: TrafficSetupConfig | null,
  suggestedSlotTimes: string[],
): SetupFormState {
  if (config) {
    return {
      marketId: config.marketId,
      clusterName: config.clusterName,
      automationSystem: config.automationSystem,
      segmentLabel: config.segmentLabel,
      slotTimesText: toSlotLines(config.slotTimes),
    };
  }

  return {
    ...createDefaultState(),
    slotTimesText: toSlotLines(suggestedSlotTimes),
  };
}

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

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export function TrafficControlCenter({ activeViewId }: TrafficControlCenterProps) {
  const [bootstrap, setBootstrap] = useState<TrafficSetupBootstrap | null>(null);
  const [formState, setFormState] = useState<SetupFormState>(createDefaultState());
  const [candidateForm, setCandidateForm] = useState<CoverageCandidateFormState>(
    createDefaultCoverageCandidateState(),
  );
  const [runs, setRuns] = useState<TrafficRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingCandidate, setIsSubmittingCandidate] = useState(false);
  const [approvingCandidateId, setApprovingCandidateId] = useState<string | null>(null);
  const [generatingSlotTime, setGeneratingSlotTime] = useState<string | null>(null);
  const [controlConfig, setControlConfig] = useState<TrafficControlConfig | null>(null);
  const [controlConfigDraft, setControlConfigDraft] = useState<TrafficControlDraft>(
    createDefaultControlConfigDraft(),
  );
  const [controlConfigJson, setControlConfigJson] = useState('');
  const [controlConfigJsonError, setControlConfigJsonError] = useState<string | null>(null);
  const [isLoadingControlConfig, setIsLoadingControlConfig] = useState(true);
  const [isSavingControlConfig, setIsSavingControlConfig] = useState(false);
  const [tomTomHealthCheck, setTomTomHealthCheck] = useState<TomTomHealthCheck | null>(null);
  const [isCheckingTomTom, setIsCheckingTomTom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const loadSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withTenantAuth('/api/traffic/setup');
      if (!response.ok) {
        throw new Error('Traffic setup bootstrap failed');
      }

      const payload = (await response.json()) as TrafficSetupBootstrap;
      setBootstrap(payload);
      setFormState(hydrateForm(payload.config, payload.suggestedSlotTimes));
    } catch (loadError) {
      setBootstrap((current) => current ?? createFallbackBootstrap());
      setFormState((current) =>
        current.slotTimesText.trim().length > 0
          ? current
          : hydrateForm(null, createFallbackBootstrap().suggestedSlotTimes),
      );
      setError(loadError instanceof Error ? loadError.message : 'Unable to load setup data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setIsLoadingRuns(true);

    try {
      const response = await withTenantAuth('/api/traffic/runs');
      if (!response.ok) {
        throw new Error('Traffic runs failed to load');
      }

      const payload = (await response.json()) as TrafficRunListResponse;
      setRuns(payload.runs);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load traffic runs');
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  const loadControlConfig = useCallback(async () => {
    setIsLoadingControlConfig(true);

    try {
      const response = await withTenantAuth('/api/traffic/control-config');
      if (!response.ok) {
        throw new Error('Traffic control config failed to load');
      }

      const payload = (await response.json()) as TrafficControlConfig;
      const nextDraft = toControlConfigDraft(payload);
      setControlConfig(payload);
      setControlConfigDraft(nextDraft);
      setControlConfigJson(JSON.stringify(nextDraft, null, 2));
      setControlConfigJsonError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load traffic control config',
      );
    } finally {
      setIsLoadingControlConfig(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadSetup(), loadRuns(), loadControlConfig()]);
  }, [loadControlConfig, loadRuns, loadSetup]);

  const slotTimes = useMemo(
    () => parseSlotLines(formState.slotTimesText),
    [formState.slotTimesText],
  );
  const invalidSlots = useMemo(() => slotTimes.filter((slot) => !isValidSlot(slot)), [slotTimes]);
  const configured = Boolean(bootstrap?.config);
  const latestRunsBySlotTime = useMemo(() => {
    return runs.reduce<Record<string, TrafficRun>>((accumulator, run) => {
      if (!accumulator[run.slotTime]) {
        accumulator[run.slotTime] = run;
      }

      return accumulator;
    }, {});
  }, [runs]);

  const handleChange = <T extends keyof SetupFormState>(key: T, value: SetupFormState[T]) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaveNotice(null);
    setError(null);
    setIsSaving(true);

    try {
      const payload: SaveTrafficSetupRequest = {
        marketId: formState.marketId,
        clusterName: formState.clusterName,
        automationSystem: formState.automationSystem,
        segmentLabel: formState.segmentLabel,
        slotTimes: slotTimes.filter((slot) => isValidSlot(slot)),
      };

      const response = await withTenantAuth('/api/traffic/setup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? 'Unable to save traffic setup');
      }

      const saved = (await response.json()) as TrafficSetupConfig;
      setBootstrap((current) =>
        current
          ? {
              ...current,
              config: saved,
            }
          : null,
      );

      setFormState((current) => ({ ...current, slotTimesText: toSlotLines(saved.slotTimes) }));
      setSaveNotice('Traffic setup saved. Scheduler can now target explicit report slots.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save setup');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCoverageCandidate = async () => {
    setSaveNotice(null);
    setError(null);
    setIsSubmittingCandidate(true);

    try {
      const payload: CreateCoverageCandidateRequest = {
        name: candidateForm.name,
        state: candidateForm.state,
        timezone: candidateForm.timezone,
        dataSource: 'ui-candidate-form',
      };

      const response = await withTenantAuth('/api/traffic/coverage-candidates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? 'Unable to create candidate');
      }

      const created = (await response.json()) as TrafficCoverageCandidate;
      setBootstrap((current) =>
        current
          ? {
              ...current,
              coverageCandidates: [created, ...current.coverageCandidates],
            }
          : current,
      );
      setCandidateForm(createDefaultCoverageCandidateState());
      setSaveNotice('Coverage candidate submitted for review.');
    } catch (candidateError) {
      setError(
        candidateError instanceof Error ? candidateError.message : 'Unable to create candidate',
      );
    } finally {
      setIsSubmittingCandidate(false);
    }
  };

  const handleApproveCandidate = async (candidateId: string) => {
    setSaveNotice(null);
    setError(null);
    setApprovingCandidateId(candidateId);

    try {
      const response = await withTenantAuth(
        `/api/traffic/coverage-candidates/${candidateId}/approve`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? 'Unable to approve coverage candidate');
      }

      await loadSetup();
      setSaveNotice('Coverage candidate approved and published to market catalog.');
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : 'Unable to approve coverage candidate',
      );
    } finally {
      setApprovingCandidateId(null);
    }
  };

  const handleGenerateRun = async (slotTime: string) => {
    setSaveNotice(null);
    setError(null);
    setGeneratingSlotTime(slotTime);

    try {
      const mappedCart = controlConfig ? findCartForSlot(slotTime, controlConfig.carts) : null;
      const payload: GenerateTrafficRunRequest = {
        slotTime,
        notes: mappedCart?.slotContext?.trim() || undefined,
      };
      const response = await withTenantAuth('/api/traffic/runs/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? 'Unable to generate traffic run');
      }

      const created = (await response.json()) as TrafficRun;
      setRuns((current) =>
        [created, ...current.filter((run) => run.id !== created.id)].slice(0, 20),
      );
      setSaveNotice(`Generated manual readiness run for ${slotTime}.`);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Unable to generate run');
    } finally {
      setGeneratingSlotTime(null);
    }
  };

  const handleSaveControlConfig = async () => {
    setSaveNotice(null);
    setError(null);
    setIsSavingControlConfig(true);

    try {
      const parsedDraft = toControlConfigDraft(JSON.parse(controlConfigJson));
      const payload: SaveTrafficControlConfigRequest = {
        config: parsedDraft,
      };

      const response = await withTenantAuth('/api/traffic/control-config', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? 'Unable to save traffic control config');
      }

      const saved = (await response.json()) as TrafficControlConfig;
      const nextDraft = toControlConfigDraft(saved);
      setControlConfig(saved);
      setControlConfigDraft(nextDraft);
      setControlConfigJson(JSON.stringify(nextDraft, null, 2));
      setControlConfigJsonError(null);
      setSaveNotice('Traffic control configuration saved for this tenant.');
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save traffic control config';
      setControlConfigJsonError(message);
      setError(message);
    } finally {
      setIsSavingControlConfig(false);
    }
  };

  const handleControlDraftChange = (next: TrafficControlDraft) => {
    setControlConfigDraft(next);
    setControlConfigJson(JSON.stringify(next, null, 2));
    setControlConfigJsonError(null);
  };

  const handleApplyRawControlConfig = () => {
    try {
      const parsed = JSON.parse(controlConfigJson) as unknown;
      const nextDraft = toControlConfigDraft(parsed);
      setControlConfigDraft(nextDraft);
      setControlConfigJson(JSON.stringify(nextDraft, null, 2));
      setControlConfigJsonError(null);
      setSaveNotice('Raw JSON applied to structured editor.');
    } catch {
      setControlConfigJsonError('Invalid JSON. Fix formatting before applying.');
    }
  };

  const handleTomTomHealthCheck = async () => {
    setSaveNotice(null);
    setError(null);
    setIsCheckingTomTom(true);

    try {
      const response = await withTenantAuth('/api/traffic/tomtom-health');
      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? 'Unable to test TomTom connectivity');
      }

      const payload = (await response.json()) as TomTomHealthCheck;
      setTomTomHealthCheck(payload);
      setSaveNotice(payload.summary);
    } catch (healthError) {
      setTomTomHealthCheck(null);
      setError(
        healthError instanceof Error ? healthError.message : 'Unable to test TomTom connectivity',
      );
    } finally {
      setIsCheckingTomTom(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="odyssey-panel">
        <CardContent className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading traffic setup...
        </CardContent>
      </Card>
    );
  }

  const setupViewActive = activeViewId === 'setup';

  return (
    <div className="space-y-4">
      <Card className="odyssey-panel border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">Traffic Runtime Status</CardTitle>
            <Badge variant={configured ? 'secondary' : 'outline'}>
              {configured ? 'Configured' : 'Needs setup'}
            </Badge>
          </div>
          <CardDescription>
            Traffic now runs from tenant-scoped market and slot configuration instead of static
            sample cards.
          </CardDescription>
        </CardHeader>
        {error ? (
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void loadSetup()}>
                Retry Setup Load
              </Button>
            </div>
          </CardContent>
        ) : null}
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Active market
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {bootstrap?.availableMarkets.find((market) => market.id === formState.marketId)
                ?.name ?? 'Not selected'}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Explicit slots
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{slotTimes.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Segment</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formState.segmentLabel || 'Not set'}
            </p>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-background/50 p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleTomTomHealthCheck()}
              disabled={isCheckingTomTom}
            >
              {isCheckingTomTom ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test TomTom Live Pull
            </Button>
            {tomTomHealthCheck ? (
              <Badge variant={tomTomHealthCheck.ok ? 'secondary' : 'outline'}>
                {tomTomHealthCheck.provider} • incidents: {tomTomHealthCheck.incidentCount}
              </Badge>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Validate live provider before generating slot runs.
            </p>
          </div>
        </CardContent>
      </Card>

      {setupViewActive ? (
        <Card className="odyssey-panel">
          <CardHeader>
            <CardTitle className="text-xl">Traffic Setup Wizard</CardTitle>
            <CardDescription>
              Configure market coverage, cluster profile, and exact run slots for each traffic
              segment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-muted-foreground">Market coverage</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  value={formState.marketId}
                  onChange={(event) => handleChange('marketId', event.target.value)}
                >
                  <option value="">Select a city</option>
                  {bootstrap?.availableMarkets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}, {market.state} ({market.coverageStatus})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-muted-foreground">Automation system</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  value={formState.automationSystem}
                  onChange={(event) => handleChange('automationSystem', event.target.value)}
                  placeholder="WideOrbit"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-muted-foreground">Cluster name</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  value={formState.clusterName}
                  onChange={(event) => handleChange('clusterName', event.target.value)}
                  placeholder="Boise Cluster"
                />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-muted-foreground">Segment label</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  value={formState.segmentLabel}
                  onChange={(event) => handleChange('segmentLabel', event.target.value)}
                  placeholder="Morning Drive"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">
                Explicit slot times (HH:MM, one per line)
              </span>
              <textarea
                className="min-h-36 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
                value={formState.slotTimesText}
                onChange={(event) => handleChange('slotTimesText', event.target.value)}
                placeholder="06:10\n16:10"
              />
              {invalidSlots.length > 0 ? (
                <p className="text-xs text-destructive">
                  Invalid slot format: {invalidSlots.join(', ')}. Use HH:MM (24-hour time).
                </p>
              ) : null}
            </label>

            <TrafficControlConfigEditor
              value={controlConfigDraft}
              rawJson={controlConfigJson}
              jsonError={controlConfigJsonError}
              isLoading={isLoadingControlConfig}
              isSaving={isSavingControlConfig}
              onChange={handleControlDraftChange}
              onReload={() => {
                void loadControlConfig();
              }}
              onSave={() => {
                void handleSaveControlConfig();
              }}
              onRawJsonChange={(next) => {
                setControlConfigJson(next);
                setControlConfigJsonError(null);
              }}
              onApplyRawJson={handleApplyRawControlConfig}
            />

            {bootstrap?.canManageCoverage ? (
              <Card className="border-border/70 bg-background/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Coverage Expansion Queue</CardTitle>
                  <CardDescription>
                    Submit candidate cities, then approve them to publish into the selectable market
                    catalog.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="City name"
                      value={candidateForm.name}
                      onChange={(event) =>
                        setCandidateForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                    <input
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="State (e.g., ID)"
                      value={candidateForm.state}
                      onChange={(event) =>
                        setCandidateForm((current) => ({ ...current, state: event.target.value }))
                      }
                    />
                    <input
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Timezone"
                      value={candidateForm.timezone}
                      onChange={(event) =>
                        setCandidateForm((current) => ({
                          ...current,
                          timezone: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleCreateCoverageCandidate}
                    disabled={
                      isSubmittingCandidate ||
                      !candidateForm.name.trim() ||
                      !candidateForm.state.trim() ||
                      !candidateForm.timezone.trim()
                    }
                  >
                    {isSubmittingCandidate ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Submit Candidate
                  </Button>

                  <div className="space-y-2">
                    {bootstrap.coverageCandidates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No pending candidates.</p>
                    ) : (
                      bootstrap.coverageCandidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-background/60 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {candidate.name}, {candidate.state}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.timezone} • source: {candidate.dataSource}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => void handleApproveCandidate(candidate.id)}
                            disabled={approvingCandidateId === candidate.id}
                          >
                            {approvingCandidateId === candidate.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {error ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : null}

            {saveNotice ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{saveNotice}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving || invalidSlots.length > 0}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Setup
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setFormState(
                    hydrateForm(bootstrap?.config ?? null, bootstrap?.suggestedSlotTimes ?? []),
                  )
                }
              >
                Reset to Last Saved
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="odyssey-panel">
          <CardHeader>
            <CardTitle className="text-xl">Traffic Operations Desk</CardTitle>
            <CardDescription>
              Explicit per-slot schedule for the selected segment. Edit configuration in Setup view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slotTimes.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No schedule configured yet. Configure slot windows below, then save
                  configuration and setup values.
                </p>

                <TrafficControlConfigEditor
                  value={controlConfigDraft}
                  rawJson={controlConfigJson}
                  jsonError={controlConfigJsonError}
                  isLoading={isLoadingControlConfig}
                  isSaving={isSavingControlConfig}
                  onChange={handleControlDraftChange}
                  onReload={() => {
                    void loadControlConfig();
                  }}
                  onSave={() => {
                    void handleSaveControlConfig();
                  }}
                  onRawJsonChange={(next) => {
                    setControlConfigJson(next);
                    setControlConfigJsonError(null);
                  }}
                  onApplyRawJson={handleApplyRawControlConfig}
                />

                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.assign('/traffic?view=setup');
                  }}
                >
                  Open Setup View
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {slotTimes.map((slot, index) => (
                    <div
                      key={`${slot}-${index}`}
                      className={cn(
                        'rounded-lg border border-border/70 bg-background/55 px-3 py-3 text-sm',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-foreground">{slot}</span>
                        </div>
                        {latestRunsBySlotTime[slot] ? (
                          <Badge variant="outline">
                            {RUN_STATUS_LABELS[latestRunsBySlotTime[slot].status]}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          {latestRunsBySlotTime[slot]
                            ? DELIVERY_STATE_LABELS[latestRunsBySlotTime[slot].deliveryState]
                            : 'No run generated yet'}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border/70"
                          onClick={() => void handleGenerateRun(slot)}
                          disabled={generatingSlotTime === slot}
                        >
                          {generatingSlotTime === slot ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Generate now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Recent Traffic Runs</p>
                      <p className="text-xs text-muted-foreground">
                        Manual runtime history while provider and scheduler integration are being
                        completed.
                      </p>
                    </div>
                    {isLoadingRuns ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    {runs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No traffic runs yet. Generate a slot to seed the runtime history.
                      </p>
                    ) : (
                      runs.map((run) => (
                        <div
                          key={run.id}
                          className="rounded-lg border border-border/60 bg-background/60 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-foreground">
                                {run.slotTime}
                              </span>
                              <Badge variant="secondary">{RUN_STATUS_LABELS[run.status]}</Badge>
                              <Badge variant="outline">
                                {DELIVERY_STATE_LABELS[run.deliveryState]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{run.createdAtIso}</p>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{run.scriptText}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Source: {run.sourceSnapshot.summary}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
