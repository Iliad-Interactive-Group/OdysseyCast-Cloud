import 'server-only';

import { buildSuggestedSlotTimes, normalizeSlotTimes } from '@/lib/traffic-schedule';
import type {
  CreateCoverageCandidateRequest,
  SaveTrafficSetupRequest,
  TrafficCoverageCandidate,
  TrafficMarketOption,
  TrafficSetupBootstrap,
  TrafficSetupConfig,
} from '@/lib/traffic-setup.types';
import { getFirestoreAdmin } from '@iliad/firebase/admin';

const COLLECTIONS = {
  trafficSetupConfigs: 'odysseyTrafficSetupConfigs',
  marketCoverageCatalog: 'odysseyMarketCoverageCatalog',
  marketCoverageCandidates: 'odysseyMarketCoverageCandidates',
};

const SEED_MARKETS: TrafficMarketOption[] = [
  {
    id: 'boise-id',
    name: 'Boise',
    state: 'ID',
    timezone: 'America/Boise',
    coverageStatus: 'published',
    source: 'seed',
  },
  {
    id: 'dallas-tx',
    name: 'Dallas-Fort Worth',
    state: 'TX',
    timezone: 'America/Chicago',
    coverageStatus: 'testing',
    source: 'seed',
  },
  {
    id: 'phoenix-az',
    name: 'Phoenix',
    state: 'AZ',
    timezone: 'America/Phoenix',
    coverageStatus: 'testing',
    source: 'seed',
  },
];

interface TrafficSetupConfigDoc {
  tenantId: string;
  marketId: string;
  clusterName: string;
  automationSystem: string;
  segmentLabel: string;
  slotTimes: string[];
  reportsPerHour: number;
  updatedAtIso: string;
}

interface TrafficCoverageCandidateDoc {
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

function toMarketId(params: { name: string; state: string }): string {
  return `${params.name.trim().toLowerCase()}-${params.state.trim().toLowerCase()}`.replace(
    /[^a-z0-9-]+/g,
    '-',
  );
}

function computeReportsPerHour(slotTimes: string[]): number {
  const hours = new Set(slotTimes.map((slot) => slot.split(':')[0]));
  if (hours.size === 0) {
    return 0;
  }
  return Math.round((slotTimes.length / hours.size) * 10) / 10;
}

function mapConfigDoc(value: TrafficSetupConfigDoc): TrafficSetupConfig {
  const normalizedSlots = normalizeSlotTimes(value.slotTimes);

  return {
    tenantId: value.tenantId,
    marketId: value.marketId,
    clusterName: value.clusterName,
    automationSystem: value.automationSystem,
    segmentLabel: value.segmentLabel,
    slotTimes: normalizedSlots,
    reportsPerHour: computeReportsPerHour(normalizedSlots),
    updatedAtIso: value.updatedAtIso,
  };
}

function mapCoverageCandidate(
  id: string,
  value: TrafficCoverageCandidateDoc,
): TrafficCoverageCandidate {
  return {
    id,
    marketId: value.marketId,
    name: value.name,
    state: value.state,
    timezone: value.timezone,
    status: value.status,
    dataSource: value.dataSource,
    createdBy: value.createdBy,
    createdAtIso: value.createdAtIso,
    approvedBy: value.approvedBy,
    approvedAtIso: value.approvedAtIso,
  };
}

async function getPublishedMarkets(): Promise<TrafficMarketOption[]> {
  const db = getFirestoreAdmin();
  const snapshot = await db
    .collection(COLLECTIONS.marketCoverageCatalog)
    .where('coverageStatus', '==', 'published')
    .limit(200)
    .get();

  if (snapshot.empty) {
    return SEED_MARKETS;
  }

  const approved = snapshot.docs.map((doc) => {
    const value = doc.data() as {
      name?: string;
      state?: string;
      timezone?: string;
      coverageStatus?: 'published' | 'testing';
    };

    return {
      id: doc.id,
      name: value.name ?? 'Unknown Market',
      state: value.state ?? 'NA',
      timezone: value.timezone ?? 'UTC',
      coverageStatus: value.coverageStatus ?? 'published',
      source: 'approved' as const,
    };
  });

  return [
    ...approved,
    ...SEED_MARKETS.filter((seed) => !approved.some((city) => city.id === seed.id)),
  ];
}

async function getTenantConfig(tenantId: string): Promise<TrafficSetupConfig | null> {
  const db = getFirestoreAdmin();
  const doc = await db.collection(COLLECTIONS.trafficSetupConfigs).doc(tenantId).get();
  if (!doc.exists) {
    return null;
  }

  const value = doc.data() as TrafficSetupConfigDoc;
  return mapConfigDoc(value);
}

export async function getTrafficSetupConfigForTenant(
  tenantId: string,
): Promise<TrafficSetupConfig | null> {
  return getTenantConfig(tenantId);
}

async function getCoverageCandidates(): Promise<TrafficCoverageCandidate[]> {
  const db = getFirestoreAdmin();
  const snapshot = await db
    .collection(COLLECTIONS.marketCoverageCandidates)
    .where('status', '==', 'proposed')
    .limit(100)
    .get();

  return snapshot.docs.map((doc) =>
    mapCoverageCandidate(doc.id, doc.data() as TrafficCoverageCandidateDoc),
  );
}

export async function getTrafficSetupBootstrap(params: {
  tenantId: string;
  canManageCoverage: boolean;
}): Promise<TrafficSetupBootstrap> {
  const [availableMarkets, config, coverageCandidates] = await Promise.all([
    getPublishedMarkets(),
    getTenantConfig(params.tenantId),
    params.canManageCoverage ? getCoverageCandidates() : Promise.resolve([]),
  ]);

  return {
    tenantId: params.tenantId,
    availableMarkets,
    config,
    suggestedSlotTimes: buildSuggestedSlotTimes({
      startTime: '06:10',
      endTime: '16:10',
      reportCount: 2,
    }),
    canManageCoverage: params.canManageCoverage,
    coverageCandidates,
  };
}

export async function saveTrafficSetup(
  tenantId: string,
  payload: SaveTrafficSetupRequest,
): Promise<TrafficSetupConfig> {
  const normalizedSlots = normalizeSlotTimes(payload.slotTimes);

  const next: TrafficSetupConfigDoc = {
    tenantId,
    marketId: payload.marketId.trim(),
    clusterName: payload.clusterName.trim(),
    automationSystem: payload.automationSystem.trim(),
    segmentLabel: payload.segmentLabel.trim(),
    slotTimes: normalizedSlots,
    reportsPerHour: computeReportsPerHour(normalizedSlots),
    updatedAtIso: new Date().toISOString(),
  };

  const db = getFirestoreAdmin();
  await db.collection(COLLECTIONS.trafficSetupConfigs).doc(tenantId).set(next, { merge: true });

  return mapConfigDoc(next);
}

export async function createCoverageCandidate(params: {
  payload: CreateCoverageCandidateRequest;
  createdBy: string;
}): Promise<TrafficCoverageCandidate> {
  const marketId = toMarketId({ name: params.payload.name, state: params.payload.state });
  const next: TrafficCoverageCandidateDoc = {
    marketId,
    name: params.payload.name.trim(),
    state: params.payload.state.trim().toUpperCase(),
    timezone: params.payload.timezone.trim(),
    status: 'proposed',
    dataSource: params.payload.dataSource?.trim() || 'operator-input',
    createdBy: params.createdBy,
    createdAtIso: new Date().toISOString(),
  };

  const db = getFirestoreAdmin();
  const docRef = await db.collection(COLLECTIONS.marketCoverageCandidates).add(next);
  return mapCoverageCandidate(docRef.id, next);
}

export async function approveCoverageCandidate(params: {
  candidateId: string;
  approvedBy: string;
}): Promise<TrafficCoverageCandidate> {
  const db = getFirestoreAdmin();
  const candidateRef = db.collection(COLLECTIONS.marketCoverageCandidates).doc(params.candidateId);

  const approvedIso = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    const candidateDoc = await transaction.get(candidateRef);
    if (!candidateDoc.exists) {
      throw new Error('Coverage candidate not found');
    }

    const candidate = candidateDoc.data() as TrafficCoverageCandidateDoc;
    if (candidate.status !== 'proposed') {
      throw new Error('Coverage candidate is not in proposed status');
    }

    transaction.set(
      db.collection(COLLECTIONS.marketCoverageCatalog).doc(candidate.marketId),
      {
        name: candidate.name,
        state: candidate.state,
        timezone: candidate.timezone,
        coverageStatus: 'published',
        source: 'approved',
        approvedBy: params.approvedBy,
        approvedAtIso: approvedIso,
      },
      { merge: true },
    );

    transaction.set(
      candidateRef,
      {
        status: 'approved',
        approvedBy: params.approvedBy,
        approvedAtIso: approvedIso,
      },
      { merge: true },
    );
  });

  const updated = await candidateRef.get();
  return mapCoverageCandidate(updated.id, updated.data() as TrafficCoverageCandidateDoc);
}
