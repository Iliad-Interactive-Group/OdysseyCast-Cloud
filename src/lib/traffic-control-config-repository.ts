import 'server-only';

import type {
  SaveTrafficControlConfigRequest,
  TrafficControlConfig,
} from '@/lib/traffic-control-config.types';
import { getFirestoreAdmin } from '@iliad/firebase/admin';

const COLLECTIONS = {
  trafficControlConfigs: 'odysseyTrafficControlConfigs',
};

function createDefaultControlConfig(tenantId: string): TrafficControlConfig {
  return {
    tenantId,
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
    updatedAtIso: new Date().toISOString(),
  };
}

export async function getTrafficControlConfigForTenant(
  tenantId: string,
): Promise<TrafficControlConfig> {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection(COLLECTIONS.trafficControlConfigs).doc(tenantId).get();

  if (!snapshot.exists) {
    return createDefaultControlConfig(tenantId);
  }

  const stored = snapshot.data() as TrafficControlConfig;
  return {
    ...createDefaultControlConfig(tenantId),
    ...stored,
    tenantId,
  };
}

export async function saveTrafficControlConfigForTenant(
  tenantId: string,
  payload: SaveTrafficControlConfigRequest,
): Promise<TrafficControlConfig> {
  const next: TrafficControlConfig = {
    tenantId,
    carts: payload.config.carts ?? [],
    commutes: payload.config.commutes ?? [],
    voices: payload.config.voices ?? [],
    replacements: payload.config.replacements ?? [],
    pronunciations: payload.config.pronunciations ?? [],
    prompts: {
      consolidateAndSummarize: payload.config.prompts?.consolidateAndSummarize ?? '',
      generateTrafficNarrative: payload.config.prompts?.generateTrafficNarrative ?? '',
      createBroadcastScript: payload.config.prompts?.createBroadcastScript ?? '',
      generateSsml: payload.config.prompts?.generateSsml ?? '',
    },
    scheduler: {
      minutesBetweenRuns: payload.config.scheduler?.minutesBetweenRuns ?? 10,
      isAutomationRunning: payload.config.scheduler?.isAutomationRunning ?? false,
      useCache: payload.config.scheduler?.useCache ?? false,
      skipFirstRunOnStartup: payload.config.scheduler?.skipFirstRunOnStartup ?? true,
    },
    updatedAtIso: new Date().toISOString(),
  };

  const db = getFirestoreAdmin();
  await db.collection(COLLECTIONS.trafficControlConfigs).doc(tenantId).set(next, { merge: true });

  return next;
}
