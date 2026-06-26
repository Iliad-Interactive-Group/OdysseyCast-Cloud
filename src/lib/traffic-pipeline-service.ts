import 'server-only';

import type {
  GenerateTrafficRunRequest,
  TrafficPipelineStepResult,
  TrafficSourceSnapshot,
} from '@/lib/traffic-runtime.types';
import { getTrafficControlConfigForTenant } from '@/lib/traffic-control-config-repository';
import type {
  TrafficControlCart,
  TrafficControlCommute,
  TrafficControlLeg,
  TrafficControlRoute,
  TrafficControlSegment,
} from '@/lib/traffic-control-config.types';
import { resolveTrafficGeminiApiKey, resolveTrafficTomTomApiKey } from '@/lib/traffic-env';
import type { TrafficSetupConfig } from '@/lib/traffic-setup.types';
import { enqueueTrafficDeliveryJob } from '@/lib/traffic-delivery-repository';
import {
  applyPronunciationGuides,
  buildBroadcastSsml,
  getGeminiPrimaryModelId,
  getGoogleAiTextModelByLane,
  getGenkitInstance,
} from '@iliad/ai';
import { getStorageAdmin } from '@iliad/firebase/admin';
import { randomUUID } from 'node:crypto';

interface PipelineIncident {
  commuteName?: string;
  description: string;
  from?: string;
  to?: string;
  delayMinutes?: number;
  roadNumbers?: string[];
}

interface PipelineRouteTelemetry {
  commuteName: string;
  routeName: string;
  legName: string;
  lengthMeters: number;
  travelTimeSeconds: number;
  trafficDelaySeconds: number;
}

interface PipelineFlowTelemetry {
  commuteName: string;
  routeName: string;
  legName: string;
  segmentName: string;
  roadName: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  currentTravelTime: number;
  freeFlowTravelTime: number;
  roadClosure?: boolean;
}

interface PipelineLegHierarchy {
  commuteName: string;
  routeName: string;
  legName: string;
  route: {
    lengthMeters: number;
    travelTimeSeconds: number;
    trafficDelaySeconds: number;
  } | null;
  segments: Array<{
    segmentName: string;
    roadName: string;
    flow: {
      currentSpeed: number;
      freeFlowSpeed: number;
      currentTravelTime: number;
      freeFlowTravelTime: number;
      roadClosure?: boolean;
    } | null;
  }>;
}

interface PipelineRouteHierarchy {
  commuteName: string;
  routeName: string;
  legs: PipelineLegHierarchy[];
}

interface PipelineCommuteHierarchy {
  commuteName: string;
  routes: PipelineRouteHierarchy[];
}

interface PipelineTelemetry {
  incidents: PipelineIncident[];
  routes: PipelineRouteTelemetry[];
  flows: PipelineFlowTelemetry[];
  hierarchy: PipelineCommuteHierarchy[];
  provider: TrafficSourceSnapshot['provider'];
  summary: string;
  activeCart: TrafficControlCart | null;
  activeCommuteName: string | null;
}

interface PipelineContext {
  setup: TrafficSetupConfig;
  notes?: string;
  slotTime: string;
  tenantId: string;
}

interface PipelineResult {
  sourceSnapshot: TrafficSourceSnapshot;
  summaryText: string;
  narrativeText: string;
  scriptText: string;
  ssmlText: string;
  audioUrl: string;
  audioMimeType: string;
  deliveryJobId: string;
  pipelineSteps: TrafficPipelineStepResult[];
}

const MARKET_BBOX: Record<string, string> = {
  'boise-id': '-116.30,43.48,-116.02,43.69',
  'dallas-tx': '-97.11,32.62,-96.52,33.03',
  'phoenix-az': '-112.32,33.20,-111.93,33.66',
};

function markStep(
  steps: TrafficPipelineStepResult[],
  step: TrafficPipelineStepResult['step'],
  status: TrafficPipelineStepResult['status'],
  message: string,
) {
  steps.push({
    step,
    status,
    message,
    completedAtIso: new Date().toISOString(),
  });
}

function toMinutes(value: string): number | null {
  const parts = value.split(':');
  if (parts.length !== 2) return null;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour * 60 + minute;
}

function isWithinWindow(slotTime: string, startTime: string, endTime: string): boolean {
  const slot = toMinutes(slotTime);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (slot === null || start === null || end === null) return false;

  if (end < start) {
    return slot >= start || slot <= end;
  }

  return slot >= start && slot <= end;
}

function findActiveCart(slotTime: string, carts: TrafficControlCart[]): TrafficControlCart | null {
  return (
    carts.find((cart) => isWithinWindow(slotTime, cart.startTime, cart.endTime)) ??
    carts.find((cart) => cart.startTime === slotTime) ??
    null
  );
}

function parseCoordinates(input: string): Array<{ lat: number; lon: number }> {
  return input
    .split(':')
    .map((pair) => {
      const [latRaw, lonRaw] = pair.split(',').map((part) => Number(part.trim()));
      return { lat: latRaw, lon: lonRaw };
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
}

function midpointForSegment(input: string): string | null {
  const points = parseCoordinates(input);
  if (points.length === 0) {
    return null;
  }

  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lon = points.reduce((sum, point) => sum + point.lon, 0) / points.length;

  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function kphToMph(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value ?? 0) * 0.621371);
}

async function fetchRouteTelemetry(
  apiKey: string,
  coordinates: string,
): Promise<{
  lengthMeters: number;
  travelTimeSeconds: number;
  trafficDelaySeconds: number;
} | null> {
  const path = coordinates.trim();
  if (!path) {
    return null;
  }

  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${path}/json?` +
    new URLSearchParams({
      key: apiKey,
      computeTravelTimeFor: 'all',
      traffic: 'true',
    }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      routes?: Array<{
        summary?: {
          lengthInMeters?: number;
          travelTimeInSeconds?: number;
          trafficDelayInSeconds?: number;
        };
      }>;
    };

    const summary = payload.routes?.[0]?.summary;
    if (!summary) {
      return null;
    }

    return {
      lengthMeters: summary.lengthInMeters ?? 0,
      travelTimeSeconds: summary.travelTimeInSeconds ?? 0,
      trafficDelaySeconds: summary.trafficDelayInSeconds ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchFlowTelemetry(
  apiKey: string,
  segmentCoordinates: string,
): Promise<{
  currentSpeed: number;
  freeFlowSpeed: number;
  currentTravelTime: number;
  freeFlowTravelTime: number;
  roadClosure?: boolean;
} | null> {
  const point = midpointForSegment(segmentCoordinates);
  if (!point) {
    return null;
  }

  const url =
    `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/12/json?` +
    new URLSearchParams({ key: apiKey, point }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      flowSegmentData?: {
        currentSpeed?: number;
        freeFlowSpeed?: number;
        currentTravelTime?: number;
        freeFlowTravelTime?: number;
        roadClosure?: boolean;
      };
    };

    const flow = payload.flowSegmentData;
    if (!flow) {
      return null;
    }

    return {
      currentSpeed: kphToMph(flow.currentSpeed),
      freeFlowSpeed: kphToMph(flow.freeFlowSpeed),
      currentTravelTime: flow.currentTravelTime ?? 0,
      freeFlowTravelTime: flow.freeFlowTravelTime ?? 0,
      roadClosure: flow.roadClosure,
    };
  } catch {
    return null;
  }
}

async function fetchIncidentsForBbox(apiKey: string, bbox: string): Promise<PipelineIncident[]> {
  const params = new URLSearchParams({
    bbox,
    fields:
      '{incidents{type,properties{from,to,roadNumbers,events{description},delay,magnitudeOfDelay}}}',
    language: 'en-US',
    timeValidityFilter: 'present',
    key: apiKey,
  });

  try {
    const response = await fetch(
      `https://api.tomtom.com/traffic/services/5/incidentDetails?${params.toString()}`,
    );
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      incidents?: Array<{
        properties?: {
          from?: string;
          to?: string;
          roadNumbers?: string[];
          delay?: number;
          events?: Array<{ description?: string }>;
        };
      }>;
    };

    return (payload.incidents ?? []).map((incident) => {
      const eventDescription = incident.properties?.events?.[0]?.description;
      return {
        description: eventDescription || 'Traffic slowdown reported',
        from: incident.properties?.from,
        to: incident.properties?.to,
        delayMinutes: incident.properties?.delay
          ? Math.max(1, Math.round(incident.properties.delay / 60))
          : undefined,
        roadNumbers: incident.properties?.roadNumbers ?? [],
      };
    });
  } catch {
    return [];
  }
}

async function gatherTelemetry(params: {
  setup: TrafficSetupConfig;
  tenantId: string;
  slotTime: string;
}): Promise<PipelineTelemetry> {
  const controlConfig = await getTrafficControlConfigForTenant(params.tenantId);
  const activeCart = findActiveCart(params.slotTime, controlConfig.carts);
  const activeCommute = activeCart
    ? controlConfig.commutes.find((commute) => commute.id === activeCart.commuteId) ?? null
    : null;

  const apiKey = resolveTrafficTomTomApiKey();
  if (!apiKey) {
    return {
      incidents: [],
      routes: [],
      flows: [],
      hierarchy: [],
      provider: 'tomtom-fallback',
      summary:
        'TomTom key missing. Set TOMTOM_API_KEY or ODYSSEYCAST_TOMTOM_KEY for live traffic pulls.',
      activeCart,
      activeCommuteName: activeCommute?.name ?? null,
    };
  }

  const commutes = controlConfig.commutes;
  const incidentCallDescriptors: Array<{
    commuteName: string;
    bboxName: string;
    bbox: string;
  }> = [];

  const hierarchy = await Promise.all(
    commutes.map(async (commute: TrafficControlCommute) => {
      const commuteName = commute.name || commute.id;

      const routes = await Promise.all(
        commute.routes.map(async (route: TrafficControlRoute) => {
          const routeName = route.name || route.id;

          const legs = await Promise.all(
            route.legs.map(async (leg: TrafficControlLeg) => {
              const routeTelemetry = await fetchRouteTelemetry(apiKey, leg.coordinates);

              const segments = await Promise.all(
                leg.segments.map(async (segment: TrafficControlSegment) => {
                  const flowTelemetry = await fetchFlowTelemetry(apiKey, segment.coordinates);

                  return {
                    segmentName: segment.name || segment.id,
                    roadName: segment.roadName || segment.name || segment.id,
                    flow: flowTelemetry,
                  };
                }),
              );

              return {
                commuteName,
                routeName,
                legName: leg.name || leg.id,
                route: routeTelemetry,
                segments,
              };
            }),
          );

          return {
            commuteName,
            routeName,
            legs,
          };
        }),
      );

      commute.incidentBboxes.forEach((bbox) => {
        incidentCallDescriptors.push({
          commuteName,
          bboxName: bbox.name || bbox.id,
          bbox: bbox.bbox,
        });
      });

      return {
        commuteName,
        routes,
      };
    }),
  );

  if (incidentCallDescriptors.length === 0) {
    const fallbackBbox = MARKET_BBOX[params.setup.marketId];
    if (fallbackBbox) {
      incidentCallDescriptors.push({
        commuteName: activeCommute?.name || params.setup.clusterName,
        bboxName: 'market-fallback',
        bbox: fallbackBbox,
      });
    }
  }

  const incidentResultSets = await Promise.all(
    incidentCallDescriptors.map(async (descriptor) => {
      const incidents = await fetchIncidentsForBbox(apiKey, descriptor.bbox);
      return incidents.map((incident) => ({
        ...incident,
        commuteName: descriptor.commuteName,
      }));
    }),
  );

  const routes = hierarchy
    .flatMap((commute) => commute.routes)
    .flatMap((route) => route.legs)
    .flatMap((leg) => {
      if (!leg.route) {
        return [];
      }

      return [
        {
          commuteName: leg.commuteName,
          routeName: leg.routeName,
          legName: leg.legName,
          lengthMeters: leg.route.lengthMeters,
          travelTimeSeconds: leg.route.travelTimeSeconds,
          trafficDelaySeconds: leg.route.trafficDelaySeconds,
        },
      ];
    });

  const flows = hierarchy
    .flatMap((commute) => commute.routes)
    .flatMap((route) => route.legs)
    .flatMap((leg) =>
      leg.segments.flatMap((segment) => {
        if (!segment.flow) {
          return [];
        }

        return [
          {
            commuteName: leg.commuteName,
            routeName: leg.routeName,
            legName: leg.legName,
            segmentName: segment.segmentName,
            roadName: segment.roadName,
            currentSpeed: segment.flow.currentSpeed,
            freeFlowSpeed: segment.flow.freeFlowSpeed,
            currentTravelTime: segment.flow.currentTravelTime,
            freeFlowTravelTime: segment.flow.freeFlowTravelTime,
            roadClosure: segment.flow.roadClosure,
          },
        ];
      }),
    );
  const incidents = incidentResultSets.flat().slice(0, 120);

  const routeCallCount = hierarchy
    .flatMap((commute) => commute.routes)
    .reduce((count, route) => count + route.legs.length, 0);
  const flowCallCount = hierarchy
    .flatMap((commute) => commute.routes)
    .flatMap((route) => route.legs)
    .reduce((count, leg) => count + leg.segments.length, 0);

  return {
    incidents,
    routes,
    flows,
    hierarchy,
    provider: 'tomtom-live',
    summary:
      `Live TomTom telemetry fetched for ${params.setup.marketId}. ` +
      `calls route=${routeCallCount}, flow=${flowCallCount}, incident=${incidentCallDescriptors.length}; ` +
      `results route=${routes.length}, flow=${flows.length}, incidents=${incidents.length}.`,
    activeCart,
    activeCommuteName: activeCommute?.name ?? null,
  };
}

function buildIncidentBulletList(incidents: PipelineIncident[]): string {
  if (incidents.length === 0) {
    return 'No significant incidents currently reported.';
  }

  return incidents
    .map((incident, index) => {
      const road = incident.roadNumbers?.[0] ? `${incident.roadNumbers[0]}: ` : '';
      const span = incident.from && incident.to ? ` (${incident.from} -> ${incident.to})` : '';
      const delay = incident.delayMinutes ? `, ~${incident.delayMinutes} min delay` : '';
      const commute = incident.commuteName ? `[${incident.commuteName}] ` : '';
      return `${index + 1}. ${commute}${road}${incident.description}${span}${delay}`;
    })
    .join('\n');
}

function buildRouteTelemetryList(routes: PipelineRouteTelemetry[]): string {
  if (routes.length === 0) {
    return 'No route travel-time telemetry returned.';
  }

  return routes
    .slice(0, 80)
    .map((route, index) => {
      const distanceMiles = route.lengthMeters > 0 ? (route.lengthMeters / 1609.34).toFixed(1) : '0';
      const travelMinutes = Math.max(1, Math.round(route.travelTimeSeconds / 60));
      const delayMinutes = Math.max(0, Math.round(route.trafficDelaySeconds / 60));
      return `${index + 1}. [${route.commuteName}] ${route.routeName} / ${route.legName}: ${travelMinutes}m total, +${delayMinutes}m delay, ${distanceMiles}mi`;
    })
    .join('\n');
}

function buildFlowTelemetryList(flows: PipelineFlowTelemetry[]): string {
  if (flows.length === 0) {
    return 'No flow-segment telemetry returned.';
  }

  return flows
    .slice(0, 120)
    .map((flow, index) => {
      const closure = flow.roadClosure ? ', ROAD CLOSED' : '';
      return `${index + 1}. [${flow.commuteName}] ${flow.roadName} (${flow.segmentName}): speed ${flow.currentSpeed}/${flow.freeFlowSpeed}${closure}`;
    })
    .join('\n');
}

function buildHierarchyTelemetryList(hierarchy: PipelineCommuteHierarchy[]): string {
  if (hierarchy.length === 0) {
    return 'No commute hierarchy telemetry available.';
  }

  const lines: string[] = [];

  hierarchy.forEach((commute, commuteIndex) => {
    lines.push(`${commuteIndex + 1}. Commute: ${commute.commuteName}`);

    commute.routes.forEach((route, routeIndex) => {
      lines.push(`   ${commuteIndex + 1}.${routeIndex + 1} Route: ${route.routeName}`);

      route.legs.forEach((leg, legIndex) => {
        const travelMinutes = leg.route ? Math.max(1, Math.round(leg.route.travelTimeSeconds / 60)) : 0;
        const delayMinutes = leg.route ? Math.max(0, Math.round(leg.route.trafficDelaySeconds / 60)) : 0;
        const distanceMiles =
          leg.route && leg.route.lengthMeters > 0 ? (leg.route.lengthMeters / 1609.34).toFixed(1) : '0';

        lines.push(
          `      ${commuteIndex + 1}.${routeIndex + 1}.${legIndex + 1} Leg: ${leg.legName} (${travelMinutes}m total, +${delayMinutes}m delay, ${distanceMiles}mi)`,
        );

        leg.segments.forEach((segment, segmentIndex) => {
          if (!segment.flow) {
            lines.push(
              `         ${commuteIndex + 1}.${routeIndex + 1}.${legIndex + 1}.${segmentIndex + 1} Segment: ${segment.roadName} (${segment.segmentName}) flow unavailable`,
            );
            return;
          }

          const closure = segment.flow.roadClosure ? ', ROAD CLOSED' : '';
          lines.push(
            `         ${commuteIndex + 1}.${routeIndex + 1}.${legIndex + 1}.${segmentIndex + 1} Segment: ${segment.roadName} (${segment.segmentName}) speed ${segment.flow.currentSpeed}/${segment.flow.freeFlowSpeed}${closure}`,
          );
        });
      });
    });
  });

  return lines.join('\n');
}

async function generateTextWithModel(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const ai = getGenkitInstance();
  const { text } = await ai.generate({
    model: getGoogleAiTextModelByLane('flash'),
    system: params.systemPrompt,
    prompt: params.userPrompt,
    config: {
      temperature: 0.35,
    },
  });

  if (!text?.trim()) {
    throw new Error('Gemini text generation returned empty output');
  }

  return text.trim();
}

async function generateSpeechAudio(params: {
  script: string;
  voiceName?: string;
}): Promise<{ mimeType: string; audioBuffer: Buffer }> {
  const apiKey = resolveTrafficGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini key is required for traffic TTS generation. Set GOOGLE_GENAI_API_KEY or ODYSSEYCAST_TRAFFIC_GEMINI_KEY.',
    );
  }

  const modelId = process.env.GEMINI_TTS_MODEL || getGeminiPrimaryModelId('tts');
  const voiceName = params.voiceName || 'Kore';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Read this traffic bulletin naturally for radio delivery:\n${params.script}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini TTS failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            mimeType?: string;
            data?: string;
          };
        }>;
      };
    }>;
  };

  const audioPart = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .find((part) => Boolean(part.inlineData?.data));

  const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';
  const base64Data = audioPart?.inlineData?.data;

  if (!base64Data) {
    throw new Error('Gemini TTS returned no audio payload');
  }

  return {
    mimeType,
    audioBuffer: Buffer.from(base64Data, 'base64'),
  };
}

async function uploadAudioToStorage(params: {
  tenantId: string;
  slotTime: string;
  audioBuffer: Buffer;
  mimeType: string;
}): Promise<string> {
  const storage = getStorageAdmin();
  const bucket = storage.bucket();

  const ext = params.mimeType.includes('mpeg') ? 'mp3' : 'wav';
  const filename = `odysseycast/traffic/${params.tenantId}/${new Date().toISOString().slice(0, 10)}/${params.slotTime.replace(':', '-')}-${randomUUID()}.${ext}`;
  const file = bucket.file(filename);
  const downloadToken = randomUUID();

  await file.save(params.audioBuffer, {
    metadata: {
      contentType: params.mimeType,
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
    resumable: false,
  });

  const encodedPath = encodeURIComponent(filename);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${encodeURIComponent(downloadToken)}`;
}

export async function executeTrafficPipeline(
  setup: TrafficSetupConfig,
  tenantId: string,
  payload: GenerateTrafficRunRequest,
): Promise<PipelineResult> {
  resolveTrafficGeminiApiKey();

  const slotTime = payload.slotTime ?? setup.slotTimes[0];
  if (!slotTime) {
    throw new Error('Slot time is required for traffic pipeline execution');
  }

  const steps: TrafficPipelineStepResult[] = [];
  const context: PipelineContext = {
    setup,
    notes: payload.notes?.trim() || undefined,
    slotTime,
    tenantId,
  };

  const controlConfig = await getTrafficControlConfigForTenant(tenantId);

  const promptOverrides = {
    summarize: controlConfig.prompts.consolidateAndSummarize.trim(),
    narrative: controlConfig.prompts.generateTrafficNarrative.trim(),
    script: controlConfig.prompts.createBroadcastScript.trim(),
  };

  const gathered = await gatherTelemetry({
    setup,
    tenantId,
    slotTime,
  });
  markStep(
    steps,
    'gather',
    'completed',
    `Collected telemetry route=${gathered.routes.length}, flow=${gathered.flows.length}, incidents=${gathered.incidents.length}.`,
  );

  const summaryText = await generateTextWithModel({
    systemPrompt:
      promptOverrides.summarize ||
      'You are a traffic operations summarizer. Keep output concise, factual, and suitable for radio prep.',
    userPrompt: [
      `Cluster: ${context.setup.clusterName}`,
      `Market: ${context.setup.marketId}`,
      `Segment: ${context.setup.segmentLabel}`,
      `Slot: ${context.slotTime}`,
      gathered.activeCommuteName ? `Active commute: ${gathered.activeCommuteName}` : 'Active commute: none',
      gathered.activeCart ? `Active cart: ${gathered.activeCart.name}` : 'Active cart: none',
      context.notes ? `Operator notes: ${context.notes}` : 'Operator notes: none',
      'Commute -> route -> leg -> segment telemetry hierarchy:',
      buildHierarchyTelemetryList(gathered.hierarchy),
      'Route telemetry:',
      buildRouteTelemetryList(gathered.routes),
      'Flow segment telemetry:',
      buildFlowTelemetryList(gathered.flows),
      'Incidents:',
      buildIncidentBulletList(gathered.incidents),
      'Use all three nested layers together: commute corridor, route leg timings, and flow segment checkpoints. Return a concise operations summary (6-10 bullets) with commute-first callouts and only relevant incidents.',
    ].join('\n'),
  });
  markStep(steps, 'summarize', 'completed', 'Generated operational summary.');

  const narrativeText = await generateTextWithModel({
    systemPrompt:
      promptOverrides.narrative ||
      'You are a broadcast traffic producer. Create a spoken narrative from summary data, no filler.',
    userPrompt: [
      `Market: ${context.setup.marketId}`,
      `Segment label: ${context.setup.segmentLabel}`,
      gathered.activeCommuteName ? `Prioritize commute: ${gathered.activeCommuteName}` : '',
      `Summary input:\n${summaryText}`,
      'Return a tight narrative paragraph suitable for script generation.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  });
  markStep(steps, 'narrative', 'completed', 'Generated traffic narrative.');

  const scriptText = await generateTextWithModel({
    systemPrompt:
      promptOverrides.script ||
      'You write live radio traffic scripts. Keep script clear, concise, and production-safe.',
    userPrompt: [
      `Cluster: ${context.setup.clusterName}`,
      `Market: ${context.setup.marketId}`,
      `Slot: ${context.slotTime}`,
      `Automation system: ${context.setup.automationSystem}`,
      gathered.activeCart ? `Cart context: ${gathered.activeCart.slotContext}` : '',
      context.notes ? `Operator note: ${context.notes}` : '',
      `Narrative:\n${narrativeText}`,
      'Output one script paragraph (55-105 words), no markup, no stage directions. Focus on commute utility over generic closure lists.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  });
  markStep(steps, 'script', 'completed', 'Generated final script text.');

  const ssmlText = buildBroadcastSsml(applyPronunciationGuides(scriptText, {}), null);
  markStep(steps, 'ssml', 'completed', 'Built SSML wrapper for script.');

  const audio = await generateSpeechAudio({
    script: scriptText,
    voiceName: gathered.activeCart?.voiceName || undefined,
  });
  markStep(steps, 'tts', 'completed', `Generated TTS audio payload (${audio.mimeType}).`);

  const audioUrl = await uploadAudioToStorage({
    tenantId: context.tenantId,
    slotTime: context.slotTime,
    audioBuffer: audio.audioBuffer,
    mimeType: audio.mimeType,
  });
  markStep(steps, 'upload', 'completed', 'Uploaded generated audio artifact.');

  const delivery = await enqueueTrafficDeliveryJob({
    tenantId: context.tenantId,
    audioUrl,
    cartName: `${context.setup.clusterName}-${context.setup.segmentLabel}`,
    slotTime: context.slotTime,
  });
  markStep(steps, 'queue', 'completed', `Queued delivery job ${delivery.id}.`);

  return {
    sourceSnapshot: {
      provider: gathered.provider,
      generatedAtIso: new Date().toISOString(),
      incidentCount: gathered.incidents.length,
      summary: gathered.summary,
    },
    summaryText,
    narrativeText,
    scriptText,
    ssmlText,
    audioUrl,
    audioMimeType: audio.mimeType,
    deliveryJobId: delivery.id,
    pipelineSteps: steps,
  };
}
