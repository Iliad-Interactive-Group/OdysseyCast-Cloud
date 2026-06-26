import 'server-only';

import type { GenerateTrafficRunRequest, TrafficRun } from '@/lib/traffic-runtime.types';
import { executeTrafficPipeline } from '@/lib/traffic-pipeline-service';
import { getTrafficSetupConfigForTenant } from '@/lib/traffic-setup-repository';
import { getFirestoreAdmin } from '@iliad/firebase/admin';

const COLLECTIONS = {
  trafficRuns: 'odysseyTrafficRuns',
};

type TrafficRunDoc = Omit<TrafficRun, 'id'>;

function mapTrafficRun(id: string, value: TrafficRunDoc): TrafficRun {
  return {
    id,
    ...value,
  };
}

export async function listTrafficRuns(tenantId: string): Promise<TrafficRun[]> {
  const db = getFirestoreAdmin();

  try {
    const snapshot = await db
      .collection(COLLECTIONS.trafficRuns)
      .where('tenantId', '==', tenantId)
      .orderBy('createdAtIso', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map((doc) => mapTrafficRun(doc.id, doc.data() as TrafficRunDoc));
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('FAILED_PRECONDITION')) {
      throw error;
    }

    // Fallback for local/dev environments where the composite index is not created yet.
    const fallbackSnapshot = await db
      .collection(COLLECTIONS.trafficRuns)
      .where('tenantId', '==', tenantId)
      .limit(100)
      .get();

    return fallbackSnapshot.docs
      .map((doc) => mapTrafficRun(doc.id, doc.data() as TrafficRunDoc))
      .sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso))
      .slice(0, 20);
  }
}

export async function generateTrafficRun(
  tenantId: string,
  payload: GenerateTrafficRunRequest,
): Promise<TrafficRun> {
  const config = await getTrafficSetupConfigForTenant(tenantId);

  if (!config) {
    throw new Error('Traffic setup must be completed before generating a run');
  }

  const slotTime = payload.slotTime ?? config.slotTimes[0];

  if (!slotTime) {
    throw new Error('Traffic setup must include at least one slot before generating a run');
  }

  const nowIso = new Date().toISOString();
  const db = getFirestoreAdmin();

  try {
    const pipeline = await executeTrafficPipeline(config, tenantId, payload);

    const next: TrafficRunDoc = {
      tenantId,
      marketId: config.marketId,
      clusterName: config.clusterName,
      automationSystem: config.automationSystem,
      segmentLabel: config.segmentLabel,
      slotTime,
      trigger: 'manual',
      status: 'generated',
      deliveryState: 'queued',
      summaryText: pipeline.summaryText,
      narrativeText: pipeline.narrativeText,
      scriptText: pipeline.scriptText,
      ssmlText: pipeline.ssmlText,
      audioUrl: pipeline.audioUrl,
      audioMimeType: pipeline.audioMimeType,
      deliveryJobId: pipeline.deliveryJobId,
      pipelineSteps: pipeline.pipelineSteps,
      sourceSnapshot: pipeline.sourceSnapshot,
      notes: payload.notes?.trim() || undefined,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    const docRef = await db.collection(COLLECTIONS.trafficRuns).add(next);
    return mapTrafficRun(docRef.id, next);
  } catch (error) {
    const failed: TrafficRunDoc = {
      tenantId,
      marketId: config.marketId,
      clusterName: config.clusterName,
      automationSystem: config.automationSystem,
      segmentLabel: config.segmentLabel,
      slotTime,
      trigger: 'manual',
      status: 'failed',
      deliveryState: 'failed',
      scriptText: '',
      pipelineSteps: [
        {
          step: 'queue',
          status: 'failed',
          message:
            error instanceof Error ? error.message : 'Traffic pipeline failed with unknown error',
          completedAtIso: nowIso,
        },
      ],
      sourceSnapshot: {
        provider: 'tomtom-fallback',
        generatedAtIso: nowIso,
        incidentCount: 0,
        summary: 'Traffic pipeline failed before delivery queue handoff.',
      },
      notes: payload.notes?.trim() || undefined,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    await db.collection(COLLECTIONS.trafficRuns).add(failed);
    throw error;
  }
}
