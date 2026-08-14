import {
  AudioLines,
  BrainCircuit,
  CloudSun,
  Copy,
  EqualApproximately,
  LayoutGrid,
  Mic2,
  Radio,
  Route,
  type LucideIcon,
} from 'lucide-react';

export type ModuleKey =
  | 'petey-agent-hub'
  | 'traffic-pulse'
  | 'weather-pulse'
  | 'voice-tracker-pro'
  | 'copyright-first'
  | 'wavlength-music-scheduling'
  | 'promosync-traffic-scheduling'
  | 'audio-playground'
  | 'remote-simpltrackr';

interface ModuleMetric {
  label: string;
  value: string;
  caption: string;
}

interface ModuleCard {
  title: string;
  body: string;
  points: string[];
}

interface RailSection {
  title: string;
  items: string[];
}

interface ModuleView {
  id: string;
  label: string;
  headline: string;
  summary: string;
  cards: ModuleCard[];
  rail: RailSection[];
}

interface CrossModuleLink {
  title: string;
  description: string;
}

export interface OdysseyModuleDefinition {
  key: ModuleKey;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  status: string;
  audience: string;
  objective: string;
  reuseLabel: string;
  metrics: ModuleMetric[];
  views: ModuleView[];
  crossModuleLinks: CrossModuleLink[];
  relatedModules: Array<{ href: string; label: string }>;
  reusePoints: string[];
}

export const ODYSSEY_MODULES: OdysseyModuleDefinition[] = [
  {
    key: 'petey-agent-hub',
    href: '/petey-agent-hub',
    label: 'Ops Hub',
    description: 'Interactive PD control center and command layer for the full suite',
    icon: BrainCircuit,
    badge: 'core',
    status: 'active-design',
    audience: 'Program directors and ops leads',
    objective:
      'Central command for programming, scheduling, creative, and operational decision support.',
    reuseLabel: 'Suite orchestration core',
    metrics: [
      {
        label: 'Modules',
        value: '9',
        caption:
          'Traffic, weather, voice, copy, music, promo traffic, audio, remote, and Petey hub.',
      },
      {
        label: 'Decision Mode',
        value: 'PD-first',
        caption: 'Petey coordinates decisions, deterministic systems enforce hard constraints.',
      },
      {
        label: 'Knowledge Backbone',
        value: 'Unified',
        caption: 'All module acceptance data feeds one tenant-scoped memory loop.',
      },
    ],
    views: [
      {
        id: 'command',
        label: 'Command',
        headline: 'Petey is the interactive PD at the center of OdysseyCast.',
        summary:
          'Petey Agent Hub orchestrates the whole cluster: what needs writing, voicing, scheduling, trafficking, review, and handoff. It acts as the command center, not a side chatbot.',
        cards: [
          {
            title: 'PD Control Layer',
            body: 'Petey should call the operational shots while still respecting deterministic policy boundaries.',
            points: [
              'Prioritize what content or schedules need operator attention now.',
              'Coordinate module handoffs: copy to production, production to schedule, schedule to traffic.',
              'Surface why decisions were made and what constraints shaped them.',
            ],
          },
          {
            title: 'Knowledge Loop',
            body: 'Accepted work across modules should continuously improve future recommendations.',
            points: [
              'Promote accepted assets and decisions into durable memory objects.',
              'Retrieve module-specific context at prompt time instead of dumping everything.',
              'Keep all memory tenant-scoped and auditable by station and cluster.',
            ],
          },
        ],
        rail: [
          {
            title: 'PD guardrails',
            items: [
              'Deterministic placement and legal constraints always win over AI suggestions.',
              'No silent writes to production schedules without explicit operator approval.',
              'All recommendations remain explainable and traceable.',
            ],
          },
        ],
      },
      {
        id: 'ops-log',
        label: 'Ops Log',
        headline: 'Petey should maintain coherent logs and schedules across every module lane.',
        summary:
          'The hub can maintain a unified operational timeline that ties weather, traffic, creative, promo traffic, and music events together for daily planning and post-mortem analysis.',
        cards: [
          {
            title: 'Single Source Timeline',
            body: 'Daily operational logs should be cohesive instead of fragmented by app.',
            points: [
              'Track generation, approvals, schedule commits, and exceptions in one stream.',
              'Correlate campaign readiness with production and placement outcomes.',
              'Provide clean handoff visibility between sales, traffic, production, and programming.',
            ],
          },
          {
            title: 'Team Leverage',
            body: 'Small teams need fewer tools and clearer triage, not more tabs.',
            points: [
              'Keep the most important actions visible in one command surface.',
              'Use Petey summaries to compress complex daypart and inventory state.',
              'Push actionable tasks directly into the owning module lanes.',
            ],
          },
        ],
        rail: [
          {
            title: 'Operational outcomes',
            items: [
              'Fewer missed avails, expiring copy, and unprepared segments.',
              'Cleaner daily logs and stronger schedule confidence.',
              'Higher output throughput with a lean ops team.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Hub + Traffic Logs',
        description:
          'Petey can prioritize campaign pressure and avail bottlenecks for traffic ops.',
      },
      {
        title: 'Hub + Wavlength',
        description: 'Petey can align programming context with creative and inventory decisions.',
      },
      {
        title: 'Hub + Audio Playground',
        description: 'Rapid SSML experimentation can feed reusable knowledge for all modules.',
      },
    ],
    relatedModules: [
      { href: '/traffic', label: 'Open Traffic Desk' },
      { href: '/traffic-logs', label: 'Open Traffic Logs (Ads)' },
      { href: '/wavlength-music-scheduling', label: 'Open Music Logs' },
      { href: '/voice-tracker-pro', label: 'Open Voice Tracker' },
    ],
    reusePoints: [
      'Treat GrowthOS patterns as UI and knowledge references only, not runtime coupling.',
      'Keep Petey as suite orchestration while each module remains independently robust.',
      'Make accepted outcomes the fuel for the shared knowledge base.',
    ],
  },
  {
    key: 'traffic-pulse',
    href: '/traffic',
    label: 'Traffic',
    description: 'Roadway traffic bulletins and live route intelligence',
    icon: Route,
    status: 'active-build',
    audience: 'Traffic desk',
    objective: 'Generate reliable, anchor-ready traffic updates from live traffic data.',
    reuseLabel: 'Traffic Pulse base',
    metrics: [
      {
        label: 'Setup Mode',
        value: 'Wizard',
        caption: 'Market, cluster, and schedule now persist per tenant.',
      },
      {
        label: 'Schedule Model',
        value: 'Explicit slots',
        caption: 'Traffic reports run at defined times per segment.',
      },
      {
        label: 'Coverage Expansion',
        value: 'Semi-auto',
        caption: 'New market candidates are API-seeded and human-approved.',
      },
    ],
    views: [
      {
        id: 'setup',
        label: 'Setup',
        headline: 'Set market coverage, cluster profile, and explicit slot times.',
        summary:
          'This setup wizard is the first global OdysseyCast onboarding pattern for data products. Configure the market, automation system, and run schedule once per tenant.',
        cards: [
          {
            title: 'Global Inputs',
            body: 'Traffic setup captures globally reusable cluster and market metadata for future modules.',
            points: [
              'Cluster and market identity are stored once for cross-module reuse.',
              'Market selection uses an approved coverage catalog, not hardcoded city assumptions.',
              'Automation system details align delivery with OdysseyCast Bridge output paths.',
            ],
          },
          {
            title: 'Scheduling Contract',
            body: 'Traffic runs on explicit report slots to match real segment cadence requirements.',
            points: [
              'Define exact HH:MM slots for each segment window.',
              'Operators can keep 18-20 daily reports with precise spacing.',
              'Saved slots become the source of truth for scheduler execution.',
            ],
          },
        ],
        rail: [
          {
            title: 'Setup controls',
            items: [
              'Market dropdown from approved city catalog.',
              'Station and automation profile per tenant.',
              'Explicit slot validation before save.',
            ],
          },
        ],
      },
      {
        id: 'desk',
        label: 'Operations',
        headline: 'Operate Traffic from explicit slot schedules and live readiness state.',
        summary:
          'The operations desk summarizes configured slots and prepares the generation path for retrieval, script creation, and Bridge delivery execution.',
        cards: [
          {
            title: 'Run Readiness',
            body: 'Keep operators focused on upcoming run commitments and slot hygiene.',
            points: [
              'View all explicit report slots for the active segment.',
              'Surface setup completion and missing data early.',
              'Drive scheduler and generation states from one source of truth.',
            ],
          },
          {
            title: 'Delivery Spine',
            body: 'Traffic output feeds OdysseyCast Bridge for downstream automation ingest.',
            points: [
              'Generated scripts and TTS output become pending delivery jobs.',
              'Bridge polling and acknowledgements close the delivery loop.',
              'Module events roll up into Petey for global operational context.',
            ],
          },
        ],
        rail: [
          {
            title: 'Traffic controls',
            items: [
              'Upcoming slot tracking and segment readiness.',
              'Setup completion and route health visibility.',
              'Generation and delivery lifecycle observability.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Traffic + Voice Tracker Pro',
        description: 'Share announcer profiles and pronunciation memory.',
      },
      {
        title: 'Traffic + Petey',
        description: 'Hub can summarize active route pressure and script readiness.',
      },
      {
        title: 'Traffic + Audio Playground',
        description: 'Test edge-case pronunciations and SSML in a safe lane.',
      },
    ],
    relatedModules: [
      { href: '/petey-agent-hub', label: 'Ops Hub' },
      { href: '/voice-tracker-pro', label: 'Voice Tracker' },
      { href: '/audio-playground', label: 'Audio Playground' },
    ],
    reusePoints: [
      'Keep domain logic intact while lifting shell and shared controls.',
      'Promote reusable route and phrase memory into tenant-scoped knowledge objects.',
      'Avoid coupling roadway traffic with ad traffic logic.',
    ],
  },
  {
    key: 'weather-pulse',
    href: '/weather-pulse',
    label: 'Weather',
    description: 'Forecast scripting, SSML, sponsorships, and automation windows',
    icon: CloudSun,
    status: 'migration-ready',
    audience: 'Producers',
    objective: 'Turn forecast data into station-ready weather content with sponsor awareness.',
    reuseLabel: 'Weather Pulse base',
    metrics: [
      {
        label: 'Pipeline',
        value: 'Proven',
        caption: 'Forecast to script to SSML to final audio already works.',
      },
      {
        label: 'SSML Tooling',
        value: 'Strong',
        caption: 'Pronunciation and sponsor SSML workbench patterns are mature.',
      },
      {
        label: 'Automation',
        value: 'Date-aware',
        caption: 'Sponsor timing windows and run gating exist.',
      },
    ],
    views: [
      {
        id: 'generator',
        label: 'Generator',
        headline: 'Weather Pulse stays a first-class production lane.',
        summary:
          'Keep the existing weather production strengths while moving the module into the Petey-centered shell and knowledge loop.',
        cards: [
          {
            title: 'Keep What Works',
            body: 'The current weather flow has meaningful production depth worth preserving.',
            points: [
              'On-demand generation and automation pathing.',
              'Sponsor date windows and SSML normalization logic.',
              'Resample, stereo, and ingest-oriented output handling.',
            ],
          },
          {
            title: 'Upgrade Through Suite Context',
            body: 'Weather gets better when connected to schedule, campaign, and agent context.',
            points: [
              'Campaign timing can be sourced from Traffic Logs rather than duplicated forever.',
              'Shared pronunciation and style memory improves forecast consistency.',
              'Petey can prioritize weather production by daypart and severity.',
            ],
          },
        ],
        rail: [
          {
            title: 'Weather controls',
            items: [
              'Voice style and scriptwriter rules.',
              'Sponsorship windows and timing checks.',
              'Output destinations and ingest safeguards.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Weather + Traffic Logs',
        description:
          'Sponsor timing should eventually be driven from the central inventory system.',
      },
      {
        title: 'Weather + Audio Playground',
        description: 'Test SSML quickly before committing to production settings.',
      },
      {
        title: 'Weather + Petey',
        description: 'Hub can sequence weather runs against broader daily content pressure.',
      },
    ],
    relatedModules: [
      { href: '/traffic-logs', label: 'Traffic Logs' },
      { href: '/audio-playground', label: 'Audio Playground' },
      { href: '/petey-agent-hub', label: 'Ops Hub' },
    ],
    reusePoints: [
      'Retain mature weather internals while unifying shell and shared context.',
      'Promote reusable sponsor and pronunciation artifacts into shared knowledge.',
      'Avoid duplicating campaign timing logic once Traffic Logs is authoritative.',
    ],
  },
  {
    key: 'voice-tracker-pro',
    href: '/voice-tracker-pro',
    label: 'Voice Tracker',
    description: 'Promo, sweeper, and utility track production from VoxAI foundations',
    icon: Mic2,
    status: 'external-source',
    audience: 'Production and talent',
    objective: 'Bring VoxAI production workflows into the unified suite under Voice Tracker Pro.',
    reuseLabel: 'VoxAI source flow',
    metrics: [
      {
        label: 'Source',
        value: 'VoxAI',
        caption: 'Script, voice, rate, and mix workflow already exists.',
      },
      {
        label: 'Output',
        value: 'Broadcast cuts',
        caption: 'Promo and utility assets for multiple module handoffs.',
      },
      {
        label: 'Role',
        value: 'Production lane',
        caption: 'Can reduce middleman bottlenecks for small teams.',
      },
    ],
    views: [
      {
        id: 'studio',
        label: 'Studio',
        headline: 'Voice Tracker Pro becomes the production lane for promo and utility cuts.',
        summary:
          'This module should preserve VoxAI strengths while gaining suite-level scheduling, campaign, and knowledge context.',
        cards: [
          {
            title: 'Core Production Loop',
            body: 'Operators need script-to-audio speed without losing quality controls.',
            points: [
              'Script-first authoring and rapid regenerate cycles.',
              'Voice, rate, and disclaimer controls in one place.',
              'Music bed and ingest-ready output handling.',
            ],
          },
          {
            title: 'Small Team Efficiency',
            body: 'AEs and production should both be able to move work forward when needed.',
            points: [
              'CopyRight First can hand off copy directly into Voice Tracker Pro.',
              'Traffic Logs can surface campaign-ready or missing-asset jobs.',
              'Petey can prioritize next-best production tasks by urgency.',
            ],
          },
        ],
        rail: [
          {
            title: 'Production controls',
            items: [
              'Voice profile defaults and station presets.',
              'Template categories for promo, sweeper, and disclaimer output.',
              'Approval and publish checkpoints before schedule handoff.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Voice Tracker Pro + CopyRight First',
        description: 'Drafted copy can become production assets without friction.',
      },
      {
        title: 'Voice Tracker Pro + Traffic Logs',
        description: 'Campaign pressure can directly drive production queue priority.',
      },
      {
        title: 'Voice Tracker Pro + Audio Playground',
        description: 'Test SSML and pronunciation variants before final publish.',
      },
    ],
    relatedModules: [
      { href: '/copyright-first', label: 'Copy' },
      { href: '/traffic-logs', label: 'Traffic Logs' },
      { href: '/audio-playground', label: 'Audio Playground' },
    ],
    reusePoints: [
      'Extract reusable VoxAI internals rather than copying the app wholesale.',
      'Unify naming, storage, and approval semantics with suite-level standards.',
      'Feed accepted voice decisions back into shared knowledge memory.',
    ],
  },
  {
    key: 'copyright-first',
    href: '/copyright-first',
    label: 'Copy',
    description: 'Sales-facing copy drafting, prep, and production handoff',
    icon: Copy,
    status: 'net-new',
    audience: 'Sales AEs and production support',
    objective: 'Enable AEs to prep strong copy and optionally generate production assets directly.',
    reuseLabel: 'New module',
    metrics: [
      {
        label: 'Primary User',
        value: 'AE-first',
        caption: 'Built for small teams where people wear multiple hats.',
      },
      {
        label: 'Output',
        value: 'Copy + assets',
        caption: 'Drafts can be handed off or self-produced into Voice Tracker Pro.',
      },
      {
        label: 'Workflow Fit',
        value: 'High',
        caption: 'Bridges sales intent and production throughput.',
      },
    ],
    views: [
      {
        id: 'drafting',
        label: 'Drafting',
        headline: 'CopyRight First gives AEs a serious copy lane without adding process drag.',
        summary:
          'AEs should be able to draft campaign copy that is clear, compliant, and production-ready before it reaches talent or traffic scheduling.',
        cards: [
          {
            title: 'AE Workflow',
            body: 'Copy should be easy to prep and route into downstream modules.',
            points: [
              'Campaign-aware templates and briefing prompts.',
              'Review status and handoff metadata.',
              'Optional direct jump into Voice Tracker Pro for self-service production.',
            ],
          },
          {
            title: 'Quality + Speed',
            body: 'Small teams need both speed and guardrails.',
            points: [
              'Policy-aware language checks.',
              'Tone alignment with station and campaign context.',
              'One-click handoff into production and Traffic Logs linking.',
            ],
          },
        ],
        rail: [
          {
            title: 'Copy controls',
            items: [
              'Template packs by advertiser vertical.',
              'Legal and disclaimer snippet references.',
              'Handoff state and owner tracking.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'CopyRight First + Voice Tracker Pro',
        description: 'Copy drafting can flow directly into production generation.',
      },
      {
        title: 'CopyRight First + Traffic Logs',
        description: 'Campaign and order context can pre-fill copy briefs.',
      },
      {
        title: 'CopyRight First + Petey',
        description: 'Petey can prioritize copy tasks based on inventory and campaign pressure.',
      },
    ],
    relatedModules: [
      { href: '/voice-tracker-pro', label: 'Voice Tracker' },
      { href: '/traffic-logs', label: 'Traffic Logs' },
      { href: '/petey-agent-hub', label: 'Ops Hub' },
    ],
    reusePoints: [
      'Design this module for AE efficiency and production handoff clarity.',
      'Make accepted copy artifacts part of the shared knowledge memory.',
      'Keep compliance and readability checks deterministic where possible.',
    ],
  },
  {
    key: 'wavlength-music-scheduling',
    href: '/wavlength-music-scheduling',
    label: 'Music Logs',
    description: 'Music scheduling and log operations using Wavlength foundations',
    icon: EqualApproximately,
    status: 'foundation',
    audience: 'Programmers and ops',
    objective: 'Use Wavlength as the rough foundation for the music scheduling module.',
    reuseLabel: 'Music Logs foundation',
    metrics: [
      {
        label: 'Base App',
        value: 'Wavlength',
        caption: 'Schedule builder, log viewer, conflicts, and station context already exist.',
      },
      {
        label: 'Role',
        value: 'Programming core',
        caption: 'Music context informs production and inventory placement quality.',
      },
      {
        label: 'Integration Goal',
        value: 'Suite-native',
        caption: 'Operate under Petey command with shared context and logs.',
      },
    ],
    views: [
      {
        id: 'scheduler',
        label: 'Scheduler',
        headline: 'Wavlength becomes the scheduling backbone inside OdysseyCast.',
        summary:
          'The goal is to absorb and refine Wavlength strengths within the suite, not to discard that foundation and start over.',
        cards: [
          {
            title: 'Current Strengths',
            body: 'Wavlength already has tangible scheduling value.',
            points: [
              'Log parsing and schedule-building surfaces.',
              'Conflict workflows and station switcher patterns.',
              'Daypart-aware scheduling context that can be expanded.',
            ],
          },
          {
            title: 'Suite Lift',
            body: 'Inside OdysseyCast, music scheduling can directly inform production and sales traffic decisions.',
            points: [
              'Clock and break context can feed Traffic Logs avail calculations.',
              'Daypart context can inform Voice Tracker Pro output pacing.',
              'Petey can keep programming and campaign pressure in sync.',
            ],
          },
        ],
        rail: [
          {
            title: 'Scheduling controls',
            items: [
              'Station and daypart filters with log date controls.',
              'Conflict severity and correction options.',
              'Publish and audit checkpoints for schedule changes.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Wavlength + Traffic Logs',
        description: 'Clock and break structure should shape deterministic avail logic.',
      },
      {
        title: 'Wavlength + Voice Tracker Pro',
        description: 'Programming context can shape promo and liner cadence.',
      },
      {
        title: 'Wavlength + Petey',
        description: 'Hub can reconcile programming intent with campaign delivery pressure.',
      },
    ],
    relatedModules: [
      { href: '/traffic-logs', label: 'Traffic Logs' },
      { href: '/voice-tracker-pro', label: 'Voice Tracker' },
      { href: '/petey-agent-hub', label: 'Ops Hub' },
    ],
    reusePoints: [
      'Treat Wavlength as the starting point for this module, not a throwaway prototype.',
      'Promote reusable scheduling entities into shared suite models.',
      'Keep AI assistive while deterministic scheduling constraints remain explicit.',
    ],
  },
  {
    key: 'promosync-traffic-scheduling',
    href: '/traffic-logs',
    label: 'Traffic Logs',
    description: 'Deterministic sales traffic operations replacing vCreative-class workflows',
    icon: LayoutGrid,
    status: 'strategic-build',
    audience: 'Sales AEs, traffic ops, and production coordinators',
    objective:
      'Provide strict deterministic inventory and order placement with AI-assisted optimization.',
    reuseLabel: 'Deterministic relational model',
    metrics: [
      {
        label: 'Replacement Target',
        value: 'vCreative class',
        caption: 'Build stronger inventory, order, and placement operations.',
      },
      {
        label: 'Decision Stack',
        value: 'Rules then AI',
        caption: 'Hard constraints first, AI ranking and guidance second.',
      },
      {
        label: 'Support Goal',
        value: 'Lean team',
        caption: 'Enable a small team to efficiently support an 8-station cluster.',
      },
    ],
    views: [
      {
        id: 'inventory',
        label: 'Inventory',
        headline: 'Traffic Logs is the deterministic authority for avails, orders, and placements.',
        summary:
          'This module should answer what is sellable, what is legal to place, and what is at risk, with deterministic confidence and clear operator visibility.',
        cards: [
          {
            title: 'Relational Core',
            body: 'Inventory and placement quality depend on strict normalized models.',
            points: [
              'Stations, dayparts, clocks, breaks, campaigns, order lines, and creative assets.',
              'Break-level capacity and reserved load tracked deterministically.',
              'Placement legality enforced through explicit rule evaluation.',
            ],
          },
          {
            title: 'AE + Traffic UX',
            body: 'AEs need instant avail insight, and traffic teams need confidence in placement decisions.',
            points: [
              'Fast avail query by station, daypart, date range, and spot length.',
              'Order constraints visible before submit.',
              'Ready and missing asset state visible before schedule commit.',
            ],
          },
        ],
        rail: [
          {
            title: 'Traffic controls',
            items: [
              'Adjacency and separation rule tuning.',
              'Fixed position and blackout enforcement.',
              'Override and makegood trails with audit context.',
            ],
          },
        ],
      },
      {
        id: 'placement',
        label: 'Placement Engine',
        headline: 'Placement is deterministic first, AI-informed second.',
        summary:
          'The engine must produce legal options using strict constraints, then let AI rank those options for pacing and business outcomes.',
        cards: [
          {
            title: 'Deterministic Layer',
            body: 'This is where operational trust is earned.',
            points: [
              'Break max seconds and max unit checks.',
              'Advertiser and category separation checks.',
              'Daypart, station, and campaign window checks.',
            ],
          },
          {
            title: 'AI Assist Layer',
            body: 'AI improves operator speed once deterministic legality is confirmed.',
            points: [
              'Rank legal avail options by pacing and campaign fulfillment.',
              'Explain placement tradeoffs in plain language.',
              'Highlight risk patterns and suggest mitigations early.',
            ],
          },
        ],
        rail: [
          {
            title: 'Engine outputs',
            items: [
              'Qualified slot set with rule-hit trace.',
              'Placement recommendation list with confidence notes.',
              'Actionable exceptions and makegood candidates.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Traffic Logs + Weather Pulse',
        description: 'Sponsor timing can be sourced from central campaign inventory state.',
      },
      {
        title: 'Traffic Logs + Voice Tracker Pro',
        description: 'Missing production assets can be routed directly for generation.',
      },
      {
        title: 'Traffic Logs + Petey',
        description: 'Petey can prioritize traffic actions using deterministic risk signals.',
      },
    ],
    relatedModules: [
      { href: '/wavlength-music-scheduling', label: 'Music Logs' },
      { href: '/voice-tracker-pro', label: 'Voice Tracker' },
      { href: '/petey-agent-hub', label: 'Ops Hub' },
    ],
    reusePoints: [
      'Keep deterministic relational rules as first-class system behavior.',
      'Use AI only after legal option sets are computed.',
      'Feed accepted placements and exceptions into shared knowledge memory.',
    ],
  },
  {
    key: 'audio-playground',
    href: '/audio-playground',
    label: 'Audio Playground',
    description: 'SSML, sponsor tags, and AI audio experimentation sandbox',
    icon: AudioLines,
    status: 'extract-ready',
    audience: 'Producers and advanced users',
    objective: 'Turn proven Weather Pulse SSML tooling into a dedicated experimentation module.',
    reuseLabel: 'Weather SSML tooling',
    metrics: [
      {
        label: 'Source',
        value: 'Weather',
        caption: 'Existing SSML and pronunciation tooling already demonstrates value.',
      },
      {
        label: 'Purpose',
        value: 'Experiment safely',
        caption: 'Try variants before changing production module behavior.',
      },
      {
        label: 'Knowledge impact',
        value: 'High',
        caption: 'Accepted findings can become reusable rules and prompt context.',
      },
    ],
    views: [
      {
        id: 'lab',
        label: 'Lab',
        headline:
          'Audio Playground becomes the suite sandbox for SSML and sponsor experimentation.',
        summary:
          'This module should let teams test SSML, phrasing, sponsor tags, and pronunciation quickly, then promote successful patterns into shared module defaults.',
        cards: [
          {
            title: 'Experiment Loop',
            body: 'Rapid test and preview is the point of this module.',
            points: [
              'Test raw SSML and sponsor tag strategies.',
              'Compare pronunciation approaches quickly.',
              'Preview output before touching production flows.',
            ],
          },
          {
            title: 'Promote What Works',
            body: 'Useful test outcomes should become durable suite knowledge.',
            points: [
              'Save approved patterns into tenant knowledge assets.',
              'Link validated SSML snippets to relevant modules.',
              'Reduce repetitive prompt tuning over time.',
            ],
          },
        ],
        rail: [
          {
            title: 'Lab controls',
            items: [
              'Voice and style variants for side-by-side preview.',
              'Sponsor-tag insertion and timing checks.',
              'Promote-to-knowledge action for accepted outputs.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Audio Playground + Weather Pulse',
        description: 'Validate sponsor and weather SSML before module rollout.',
      },
      {
        title: 'Audio Playground + Voice Tracker Pro',
        description: 'Refine promo voicing and pronunciation patterns safely.',
      },
      {
        title: 'Audio Playground + Petey',
        description: 'Petey can suggest high-impact experiments based on recurring issues.',
      },
    ],
    relatedModules: [
      { href: '/weather-pulse', label: 'Weather' },
      { href: '/voice-tracker-pro', label: 'Voice Tracker' },
      { href: '/petey-agent-hub', label: 'Ops Hub' },
    ],
    reusePoints: [
      'Extract and centralize the best SSML tooling from Weather Pulse.',
      'Keep this module intentionally safe and experimental by design.',
      'Turn accepted experiments into durable defaults and knowledge records.',
    ],
  },
  {
    key: 'remote-simpltrackr',
    href: '/odysseycast-automation',
    label: 'Automation',
    description: 'Traffic and remote automation operations through OdysseyCast-Automation',
    icon: Radio,
    status: 'integration-target',
    audience: 'Field talent and remote ops',
    objective: 'Run automation workflows and reporting in a unified cloud shell.',
    reuseLabel: 'OdysseyCast-Automation integration',
    metrics: [
      {
        label: 'Use Case',
        value: 'On-site remotes',
        caption: 'Dealerships and field activations with minimal setup friction.',
      },
      {
        label: 'Workflow',
        value: 'Cart-first',
        caption: 'Easy-to-fire cart workflows reduce remote setup errors.',
      },
      {
        label: 'Ops value',
        value: 'Reporting built-in',
        caption: 'Remote execution and outcomes become visible in suite logs.',
      },
    ],
    views: [
      {
        id: 'remote',
        label: 'Remote Ops',
        headline: 'Remote SimplTrackr handles field remotes without station-level complexity.',
        summary:
          'This module should simplify live remote execution and reporting so field teams can move fast while still feeding the suite-level operational picture.',
        cards: [
          {
            title: 'Remote Workflow',
            body: 'Reduce remote setup guesswork with opinionated workflows.',
            points: [
              'Template sets for common remote event formats.',
              'Fast cart trigger surfaces for live operation.',
              'Minimal setup and clear status visibility under pressure.',
            ],
          },
          {
            title: 'Suite Reporting',
            body: 'Remote outcomes should be first-class operational data, not disconnected notes.',
            points: [
              'Track fired assets and event timeline states.',
              'Feed event outcomes into Petey operational logs.',
              'Support post-event reporting and campaign attribution.',
            ],
          },
        ],
        rail: [
          {
            title: 'Remote controls',
            items: [
              'Preset packs by remote type.',
              'Event timer and trigger shortcuts.',
              'Auto-capture of execution events for reporting.',
            ],
          },
        ],
      },
    ],
    crossModuleLinks: [
      {
        title: 'Automation + Voice Tracker Pro',
        description: 'Remote-ready assets can be generated and loaded quickly.',
      },
      {
        title: 'Automation + Traffic Logs',
        description: 'Campaign-linked remotes can reflect inventory and sponsor status.',
      },
      {
        title: 'Automation + Petey',
        description: 'Petey can summarize remote readiness and post-event performance.',
      },
    ],
    relatedModules: [
      { href: '/voice-tracker-pro', label: 'Voice Tracker' },
      { href: '/traffic-logs', label: 'Traffic Logs' },
      { href: '/petey-agent-hub', label: 'Ops Hub' },
    ],
    reusePoints: [
      'Integrate SIMPLTRACKR workflows without forcing remote teams into complex station tooling.',
      'Capture remote execution data as structured suite events.',
      'Keep remote module UX deliberately fast and resilient.',
    ],
  },
];

export function isOdysseyRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveOdysseyModule(pathname: string): OdysseyModuleDefinition {
  return (
    ODYSSEY_MODULES.find((item) => isOdysseyRouteActive(pathname, item.href)) ?? ODYSSEY_MODULES[0]
  );
}

export function getModuleByKey(key: ModuleKey): OdysseyModuleDefinition {
  return ODYSSEY_MODULES.find((item) => item.key === key) ?? ODYSSEY_MODULES[0];
}

export function getModuleView(module: OdysseyModuleDefinition, requestedView?: string): ModuleView {
  return module.views.find((view) => view.id === requestedView) ?? module.views[0];
}
