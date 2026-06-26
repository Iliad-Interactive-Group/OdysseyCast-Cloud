export interface TrafficMarketOption {
  id: string;
  name: string;
  state: string;
  timezone: string;
  coverageStatus: 'published' | 'testing';
  source: 'seed' | 'approved';
}

export interface TrafficCoverageCandidate {
  id: string;
  marketId: string;
  name: string;
  state: string;
  timezone: string;
  status: 'proposed' | 'approved' | 'rejected';
  dataSource: string;
  createdBy: string;
  createdAtIso: string;
  approvedBy?: string;
  approvedAtIso?: string;
}

export interface TrafficSetupConfig {
  tenantId: string;
  marketId: string;
  clusterName: string;
  automationSystem: string;
  segmentLabel: string;
  slotTimes: string[];
  reportsPerHour: number;
  updatedAtIso: string;
}

export interface TrafficSetupBootstrap {
  tenantId: string;
  availableMarkets: TrafficMarketOption[];
  config: TrafficSetupConfig | null;
  suggestedSlotTimes: string[];
  canManageCoverage: boolean;
  coverageCandidates: TrafficCoverageCandidate[];
}

export interface SaveTrafficSetupRequest {
  marketId: string;
  clusterName: string;
  automationSystem: string;
  segmentLabel: string;
  slotTimes: string[];
}

export interface CreateCoverageCandidateRequest {
  name: string;
  state: string;
  timezone: string;
  dataSource?: string;
}

export interface GenerateTrafficRunRequest {
  slotTime?: string;
  notes?: string;
}
