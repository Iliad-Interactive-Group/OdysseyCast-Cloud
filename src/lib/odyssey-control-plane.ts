import type { ModuleKey } from '@/lib/odyssey-nav';

export interface OdysseyFoundationPillar {
  id: string;
  label: string;
  outcome: string;
  owner: string;
}

export interface OdysseyModuleRuntime {
  moduleKey: ModuleKey;
  schemaDomains: string[];
  dependencies: ModuleKey[];
  currentPhase: string;
  readiness: 'foundation' | 'design' | 'build' | 'integration' | 'hardening';
  targetOutcome: string;
  blockingConcerns: string[];
}

export interface OdysseyWorkItem {
  id: string;
  title: string;
  owner: string;
  moduleKey: ModuleKey;
  status: 'queued' | 'in-flight' | 'blocked';
  lane: 'platform' | 'schema' | 'workflow' | 'integration' | 'hardening';
  summary: string;
}

export interface OdysseyOperationalEvent {
  id: string;
  moduleKey: ModuleKey;
  category: 'architecture' | 'schema' | 'workflow' | 'risk' | 'release';
  title: string;
  detail: string;
  timestampLabel: string;
}

export interface OdysseyReleaseMilestone {
  id: string;
  title: string;
  modules: ModuleKey[];
  exitCriteria: string[];
}

export const ODYSSEY_FOUNDATION_PILLARS: OdysseyFoundationPillar[] = [
  {
    id: 'ui-system',
    label: 'Shared UI system',
    outcome: 'Every module inherits one shell, one command model, and one task-workspace grammar.',
    owner: 'Petey + platform',
  },
  {
    id: 'canonical-schema',
    label: 'Canonical schema',
    outcome:
      'Traffic, scheduling, content, and delivery entities use one tenant-safe data vocabulary.',
    owner: 'PromoSync + Wavlength',
  },
  {
    id: 'event-stream',
    label: 'Operational event stream',
    outcome: 'Petey sees module summaries and exceptions without reaching into module internals.',
    owner: 'Petey Agent Hub',
  },
  {
    id: 'delivery-contracts',
    label: 'Generation and delivery contracts',
    outcome:
      'Weather, traffic, voice, and remotes publish assets through the same approval and delivery shape.',
    owner: 'Weather + Traffic + Voice',
  },
];

export const ODYSSEY_MODULE_RUNTIMES: Record<ModuleKey, OdysseyModuleRuntime> = {
  'petey-agent-hub': {
    moduleKey: 'petey-agent-hub',
    schemaDomains: ['ops-events', 'knowledge-artifacts', 'exception-queue'],
    dependencies: [],
    currentPhase: 'platform-foundation',
    readiness: 'build',
    targetOutcome:
      'Petey acts as the suite control plane with timeline, queue, and module handoff visibility.',
    blockingConcerns: [
      'No shared suite event model exists yet.',
      'Module summaries are still static copy, not derived operational state.',
    ],
  },
  'promosync-traffic-scheduling': {
    moduleKey: 'promosync-traffic-scheduling',
    schemaDomains: ['inventory', 'campaigns', 'order-lines', 'placement-rules', 'audit-log'],
    dependencies: ['petey-agent-hub'],
    currentPhase: 'schema-and-engine',
    readiness: 'build',
    targetOutcome:
      'Deterministic avail, placement simulation, commit flow, and makegood handling for a tenant-safe traffic system.',
    blockingConcerns: [
      'PromoSync still runs on demo data and lacks persisted entities.',
      'Placement rules are not yet expressed as structured, auditable operators.',
    ],
  },
  'wavlength-music-scheduling': {
    moduleKey: 'wavlength-music-scheduling',
    schemaDomains: ['music-logs', 'program-clocks', 'break-structure', 'schedule-conflicts'],
    dependencies: ['promosync-traffic-scheduling'],
    currentPhase: 'integration-planning',
    readiness: 'design',
    targetOutcome:
      'Clock-aware scheduling and conflict triage feed clean break truth into the suite.',
    blockingConcerns: [
      'Schedule ingest and conflict logic have not been extracted into OdysseyCast contracts yet.',
      'Break structure must be reconciled with PromoSync inventory before UI parity work starts.',
    ],
  },
  'weather-pulse': {
    moduleKey: 'weather-pulse',
    schemaDomains: ['forecast-products', 'scripts', 'audio-renders', 'deliveries'],
    dependencies: ['petey-agent-hub', 'promosync-traffic-scheduling'],
    currentPhase: 'migration-planning',
    readiness: 'design',
    targetOutcome:
      'Forecast-to-audio workflows run inside OdysseyCast with shared approvals, sponsors, and delivery logging.',
    blockingConcerns: [
      'Shared generation and delivery contracts are not finalized yet.',
      'Sponsor timing must align to PromoSync campaign state rather than app-local logic.',
    ],
  },
  'traffic-pulse': {
    moduleKey: 'traffic-pulse',
    schemaDomains: ['route-groups', 'incident-bulletins', 'scripts', 'audio-renders', 'deliveries'],
    dependencies: ['petey-agent-hub', 'weather-pulse'],
    currentPhase: 'migration-planning',
    readiness: 'design',
    targetOutcome:
      'Live traffic bulletins share the same generation, approval, and delivery spine as weather.',
    blockingConcerns: [
      'Route group and incident urgency data are not yet normalized to the suite event model.',
      'Pronunciation assets still live conceptually inside a standalone traffic workflow.',
    ],
  },
  'voice-tracker-pro': {
    moduleKey: 'voice-tracker-pro',
    schemaDomains: ['copy-briefs', 'voice-renders', 'beds', 'publish-jobs'],
    dependencies: ['promosync-traffic-scheduling', 'traffic-pulse'],
    currentPhase: 'embedded-parity-design',
    readiness: 'foundation',
    targetOutcome:
      'Production workflows become embedded suite-native tasks instead of linked external tooling.',
    blockingConcerns: [
      'Shared audio asset contracts need to be finalized before render workflow work starts.',
      'Voice publish actions must land in the same audit and delivery model as weather and traffic.',
    ],
  },
  'copyright-first': {
    moduleKey: 'copyright-first',
    schemaDomains: ['briefs', 'drafts', 'approvals', 'handoffs'],
    dependencies: ['promosync-traffic-scheduling', 'voice-tracker-pro'],
    currentPhase: 'workflow-design',
    readiness: 'foundation',
    targetOutcome:
      'AE-facing copy prep uses campaign context directly and hands off cleanly to production.',
    blockingConcerns: [
      'No campaign-aware brief structure has been implemented yet.',
      'Compliance checkpoints and ownership flow must match the suite audit model.',
    ],
  },
  'audio-playground': {
    moduleKey: 'audio-playground',
    schemaDomains: ['ssml-tests', 'voice-presets', 'accepted-patterns'],
    dependencies: ['weather-pulse', 'voice-tracker-pro'],
    currentPhase: 'workflow-design',
    readiness: 'foundation',
    targetOutcome: 'SSML and pronunciation experiments can be promoted into reusable suite assets.',
    blockingConcerns: [
      'The promote-to-knowledge contract is not defined yet.',
      'Weather and voice modules need shared asset semantics before experiments can be published safely.',
    ],
  },
  'remote-simpltrackr': {
    moduleKey: 'remote-simpltrackr',
    schemaDomains: ['remote-events', 'event-assets', 'execution-timeline', 'reporting'],
    dependencies: ['voice-tracker-pro', 'promosync-traffic-scheduling'],
    currentPhase: 'workflow-design',
    readiness: 'foundation',
    targetOutcome:
      'Remote operations become first-class suite events with quick-fire execution and reporting.',
    blockingConcerns: [
      'Field-safe embedded parity UX has not been modeled in the shell yet.',
      'Remote execution events need the same delivery and audit backbone as studio workflows.',
    ],
  },
};

export const ODYSSEY_PRIORITY_QUEUE: OdysseyWorkItem[] = [
  {
    id: 'queue-1',
    title: 'Freeze suite entity map',
    owner: 'platform',
    moduleKey: 'petey-agent-hub',
    status: 'in-flight',
    lane: 'schema',
    summary: 'Finalize the shared entity vocabulary before deeper module CRUD work starts.',
  },
  {
    id: 'queue-2',
    title: 'Replace PromoSync demo persistence',
    owner: 'traffic-ops',
    moduleKey: 'promosync-traffic-scheduling',
    status: 'queued',
    lane: 'workflow',
    summary: 'Move inventory, campaigns, and placement rules onto tenant-scoped persisted records.',
  },
  {
    id: 'queue-3',
    title: 'Align Wavlength break truth',
    owner: 'programming',
    moduleKey: 'wavlength-music-scheduling',
    status: 'queued',
    lane: 'integration',
    summary: 'Reconcile schedule clocks and breaks with PromoSync inventory assumptions.',
  },
  {
    id: 'queue-4',
    title: 'Define generation contract',
    owner: 'content-systems',
    moduleKey: 'weather-pulse',
    status: 'queued',
    lane: 'platform',
    summary:
      'Standardize script, SSML, render, approval, and delivery events across content modules.',
  },
  {
    id: 'queue-5',
    title: 'Model remote event lifecycle',
    owner: 'field-ops',
    moduleKey: 'remote-simpltrackr',
    status: 'blocked',
    lane: 'schema',
    summary:
      'Remote execution cannot be modeled cleanly until the shared asset and delivery contract lands.',
  },
];

export const ODYSSEY_EVENT_FEED: OdysseyOperationalEvent[] = [
  {
    id: 'event-1',
    moduleKey: 'petey-agent-hub',
    category: 'architecture',
    title: 'Petey control plane activated',
    detail:
      'The suite shell is now the place where queue state, exceptions, and module summaries should converge.',
    timestampLabel: 'now',
  },
  {
    id: 'event-2',
    moduleKey: 'promosync-traffic-scheduling',
    category: 'schema',
    title: 'PromoSync entities defined',
    detail:
      'Inventory, campaign, order-line, creative, and placement entities are present, but still demo-backed.',
    timestampLabel: 'foundation',
  },
  {
    id: 'event-3',
    moduleKey: 'wavlength-music-scheduling',
    category: 'risk',
    title: 'Break structure dependency identified',
    detail:
      'PromoSync legality cannot be production-safe until Wavlength-derived clock and break truth is reconciled.',
    timestampLabel: 'next',
  },
  {
    id: 'event-4',
    moduleKey: 'weather-pulse',
    category: 'workflow',
    title: 'Weather pipeline queued for shared contract extraction',
    detail:
      'Forecast generation should become the first reusable script-to-audio contract after PromoSync persistence lands.',
    timestampLabel: 'after-promo',
  },
  {
    id: 'event-5',
    moduleKey: 'traffic-pulse',
    category: 'release',
    title: 'Traffic follows the shared content spine',
    detail:
      'Traffic integration should inherit Weather contract patterns rather than invent a second production path.',
    timestampLabel: 'wave-2',
  },
];

export const ODYSSEY_RELEASE_MILESTONES: OdysseyReleaseMilestone[] = [
  {
    id: 'milestone-1',
    title: 'Foundation lock',
    modules: ['petey-agent-hub', 'promosync-traffic-scheduling'],
    exitCriteria: [
      'Suite shell and workspace grammar are stable.',
      'Canonical entity map and event stream are agreed.',
      'PromoSync no longer depends on hardcoded demo persistence.',
    ],
  },
  {
    id: 'milestone-2',
    title: 'Broadcast scheduling spine',
    modules: ['wavlength-music-scheduling', 'weather-pulse', 'traffic-pulse'],
    exitCriteria: [
      'Break structure and inventory model reconcile cleanly.',
      'Weather and traffic share one generation, approval, and delivery contract.',
      'Petey sees production-ready schedule and content exceptions across modules.',
    ],
  },
  {
    id: 'milestone-3',
    title: 'Production parity suite',
    modules: ['voice-tracker-pro', 'copyright-first', 'audio-playground', 'remote-simpltrackr'],
    exitCriteria: [
      'Production, copy, experimentation, and remotes all emit standardized suite events.',
      'Embedded parity is achieved for their core workflows.',
      'Accepted outcomes can be promoted into the shared knowledge layer.',
    ],
  },
];

export function getModuleRuntime(moduleKey: ModuleKey): OdysseyModuleRuntime {
  return ODYSSEY_MODULE_RUNTIMES[moduleKey];
}

export function getModuleQueueItems(moduleKey: ModuleKey): OdysseyWorkItem[] {
  return ODYSSEY_PRIORITY_QUEUE.filter((item) => item.moduleKey === moduleKey);
}

export function getModuleEvents(moduleKey: ModuleKey): OdysseyOperationalEvent[] {
  return ODYSSEY_EVENT_FEED.filter((item) => item.moduleKey === moduleKey);
}
