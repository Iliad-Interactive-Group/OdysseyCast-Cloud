export type InventorySlotStatus = 'open' | 'held' | 'reserved' | 'sold' | 'blocked' | 'makegood';

export type SpotPlacementType = 'fixed' | 'floating' | 'sponsorship' | 'bonus' | 'makegood';

export type DaypartCode =
  | 'overnight'
  | 'morning-drive'
  | 'middays'
  | 'afternoon-drive'
  | 'evenings'
  | 'weekends';

export interface Cluster {
  id: string;
  tenantId: string;
  name: string;
  timezone: string;
}

export interface Station {
  id: string;
  tenantId: string;
  clusterId: string;
  callLetters: string;
  brandName: string;
  marketName: string;
  automationSystem?: string;
}

export interface Daypart {
  id: string;
  tenantId: string;
  stationId: string;
  code: DaypartCode;
  label: string;
  startTime: string;
  endTime: string;
}

export interface ProgramClock {
  id: string;
  tenantId: string;
  stationId: string;
  daypartId: string;
  name: string;
  effectiveStartDate: string;
  effectiveEndDate?: string;
}

export interface ClockBreak {
  id: string;
  tenantId: string;
  clockId: string;
  label: string;
  minuteOffset: number;
  maxUnits: number;
  maxSeconds: number;
  allowSponsorship: boolean;
}

export interface Advertiser {
  id: string;
  tenantId: string;
  legalName: string;
  displayName: string;
  category?: string;
  agencyId?: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  advertiserId: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  stationIds: string[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface OrderLine {
  id: string;
  tenantId: string;
  campaignId: string;
  stationId: string;
  daypartIds: string[];
  weeklySpots: number;
  seconds: 15 | 30 | 60;
  placementType: SpotPlacementType;
  separationAdvertiserMinutes?: number;
  separationCategoryMinutes?: number;
  fixedBreakIds?: string[];
  notes?: string;
}

export interface CreativeAsset {
  id: string;
  tenantId: string;
  campaignId: string;
  orderLineId?: string;
  assetType: 'audio' | 'copy' | 'script' | 'voice-track';
  name: string;
  durationSeconds?: number;
  status: 'missing' | 'draft' | 'approved' | 'archived';
  storageUrl?: string;
}

export interface InventorySlot {
  id: string;
  tenantId: string;
  stationId: string;
  airDate: string;
  breakId: string;
  daypartId: string;
  scheduledTime: string;
  maxSeconds: number;
  reservedSeconds: number;
  status: InventorySlotStatus;
}

export interface PlacementRule {
  id: string;
  tenantId: string;
  stationId?: string;
  name: string;
  priority: number;
  enabled: boolean;
  deterministic: boolean;
  conditions: string[];
  actions: string[];
}

export interface PlacementDecision {
  id: string;
  tenantId: string;
  inventorySlotId: string;
  orderLineId: string;
  score: number;
  reasons: string[];
  deterministicRuleHits: string[];
  aiNotes?: string[];
  approvedBy?: string;
}

export interface PlacementLog {
  id: string;
  tenantId: string;
  stationId: string;
  inventorySlotId: string;
  orderLineId: string;
  airedAt?: string;
  outcome: 'scheduled' | 'aired' | 'missed' | 'bumped' | 'makegood';
  discrepancyNotes?: string;
}

export interface AvailabilityQuery {
  tenantId: string;
  stationIds: string[];
  startDate: string;
  endDate: string;
  daypartIds?: string[];
  seconds?: Array<15 | 30 | 60>;
  placementType?: SpotPlacementType;
}

export interface AvailabilityResult {
  stationId: string;
  daypartId: string;
  openSlots: number;
  openSeconds: number;
  confidence: 'strict' | 'estimated';
  limitingFactors: string[];
}

export interface SalesTrafficSuiteModel {
  clusters: Cluster[];
  stations: Station[];
  dayparts: Daypart[];
  clocks: ProgramClock[];
  breaks: ClockBreak[];
  advertisers: Advertiser[];
  campaigns: Campaign[];
  orderLines: OrderLine[];
  creatives: CreativeAsset[];
  inventorySlots: InventorySlot[];
  placementRules: PlacementRule[];
  placementDecisions: PlacementDecision[];
  placementLogs: PlacementLog[];
}

export const PROMOSYNC_ENTITY_ORDER: string[] = [
  'clusters',
  'stations',
  'dayparts',
  'program_clocks',
  'clock_breaks',
  'advertisers',
  'campaigns',
  'order_lines',
  'creative_assets',
  'inventory_slots',
  'placement_rules',
  'placement_decisions',
  'placement_logs',
];

export const PROMOSYNC_COLLECTIONS = {
  stations: 'odyssey_promosync_stations',
  dayparts: 'odyssey_promosync_dayparts',
  clocks: 'odyssey_promosync_program_clocks',
  breaks: 'odyssey_promosync_clock_breaks',
  advertisers: 'odyssey_promosync_advertisers',
  campaigns: 'odyssey_promosync_campaigns',
  orderLines: 'odyssey_promosync_order_lines',
  creativeAssets: 'odyssey_promosync_creative_assets',
  inventorySlots: 'odyssey_promosync_inventory_slots',
  placementRules: 'odyssey_promosync_placement_rules',
  placementDecisions: 'odyssey_promosync_placement_decisions',
  placementLogs: 'odyssey_promosync_placement_logs',
} as const;

export const PROMOSYNC_SQL_SCHEMA = `
CREATE TABLE clusters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL
);

CREATE TABLE stations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  cluster_id TEXT NOT NULL REFERENCES clusters(id),
  call_letters TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  market_name TEXT NOT NULL,
  automation_system TEXT
);

CREATE TABLE dayparts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  station_id TEXT NOT NULL REFERENCES stations(id),
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE TABLE program_clocks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  station_id TEXT NOT NULL REFERENCES stations(id),
  daypart_id TEXT NOT NULL REFERENCES dayparts(id),
  name TEXT NOT NULL,
  effective_start_date DATE NOT NULL,
  effective_end_date DATE
);

CREATE TABLE clock_breaks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  clock_id TEXT NOT NULL REFERENCES program_clocks(id),
  label TEXT NOT NULL,
  minute_offset INTEGER NOT NULL,
  max_units INTEGER NOT NULL,
  max_seconds INTEGER NOT NULL,
  allow_sponsorship BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE advertisers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,
  agency_id TEXT
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  advertiser_id TEXT NOT NULL REFERENCES advertisers(id),
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE order_lines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  station_id TEXT NOT NULL REFERENCES stations(id),
  weekly_spots INTEGER NOT NULL,
  seconds INTEGER NOT NULL,
  placement_type TEXT NOT NULL,
  separation_advertiser_minutes INTEGER,
  separation_category_minutes INTEGER,
  notes TEXT
);

CREATE TABLE creative_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  order_line_id TEXT REFERENCES order_lines(id),
  asset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_seconds INTEGER,
  status TEXT NOT NULL,
  storage_url TEXT
);

CREATE TABLE inventory_slots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  station_id TEXT NOT NULL REFERENCES stations(id),
  air_date DATE NOT NULL,
  break_id TEXT NOT NULL REFERENCES clock_breaks(id),
  daypart_id TEXT NOT NULL REFERENCES dayparts(id),
  scheduled_time TEXT NOT NULL,
  max_seconds INTEGER NOT NULL,
  reserved_seconds INTEGER NOT NULL,
  status TEXT NOT NULL
);
`;
