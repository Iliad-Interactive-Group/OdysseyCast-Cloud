export type TrafficRunStatus = 'generated' | 'delivered' | 'failed';

export type TrafficDeliveryState = 'not-queued' | 'queued' | 'delivered' | 'failed';

export type TrafficRunTrigger = 'manual' | 'scheduled';

export interface TrafficSourceSnapshot {
  provider: 'tomtom-live' | 'tomtom-fallback';
  generatedAtIso: string;
  incidentCount: number;
  summary: string;
}

export type TrafficPipelineStepStatus = 'completed' | 'failed';

export interface TrafficPipelineStepResult {
  step: 'gather' | 'summarize' | 'narrative' | 'script' | 'ssml' | 'tts' | 'upload' | 'queue';
  status: TrafficPipelineStepStatus;
  message: string;
  completedAtIso: string;
}

export interface TrafficDeliveryJob {
  id: string;
  tenantId: string;
  service: 'traffic';
  audioUrl: string;
  cartName: string;
  slotTime: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  generatedAtIso: string;
  deliveredAtIso?: string;
  failedAtIso?: string;
  lastError?: string;
}

export interface TrafficRun {
  id: string;
  tenantId: string;
  marketId: string;
  clusterName: string;
  automationSystem: string;
  segmentLabel: string;
  slotTime: string;
  trigger: TrafficRunTrigger;
  status: TrafficRunStatus;
  deliveryState: TrafficDeliveryState;
  scriptText: string;
  summaryText?: string;
  narrativeText?: string;
  ssmlText?: string;
  audioUrl?: string;
  audioMimeType?: string;
  deliveryJobId?: string;
  pipelineSteps: TrafficPipelineStepResult[];
  sourceSnapshot: TrafficSourceSnapshot;
  notes?: string;
  createdAtIso: string;
  updatedAtIso: string;
  deliveredAtIso?: string;
}

export interface GenerateTrafficRunRequest {
  slotTime?: string;
  notes?: string;
}

export interface TrafficRunListResponse {
  runs: TrafficRun[];
}
