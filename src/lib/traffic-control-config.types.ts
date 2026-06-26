export interface TrafficControlCart {
  id: string;
  name: string;
  commuteId: string;
  startTime: string;
  endTime: string;
  voiceName: string;
  saveDirectory: string;
  slotContext: string;
}

export interface TrafficControlSegment {
  id: string;
  name: string;
  roadName: string;
  coordinates: string;
  startExit?: string;
  endExit?: string;
  startExitName?: string;
  endExitName?: string;
}

export interface TrafficControlLeg {
  id: string;
  name: string;
  coordinates: string;
  segments: TrafficControlSegment[];
}

export interface TrafficControlRoute {
  id: string;
  name: string;
  legs: TrafficControlLeg[];
}

export interface TrafficControlCommute {
  id: string;
  name: string;
  routes: TrafficControlRoute[];
  incidentBboxes: Array<{ id: string; name: string; bbox: string }>;
}

export interface TrafficControlVoice {
  id: string;
  name: string;
  breakMinMs: number;
  breakMaxMs: number;
  rate: string;
  pitch: string;
  volume: string;
}

export interface TrafficControlReplacement {
  id: string;
  find: string;
  replace: string;
}

export interface TrafficControlPronunciation {
  id: string;
  localName: string;
  ssml: string;
  apiVariations?: string[];
}

export interface TrafficControlPromptConfig {
  consolidateAndSummarize: string;
  generateTrafficNarrative: string;
  createBroadcastScript: string;
  generateSsml: string;
}

export interface TrafficControlScheduler {
  minutesBetweenRuns: number;
  isAutomationRunning: boolean;
  useCache: boolean;
  skipFirstRunOnStartup?: boolean;
}

export interface TrafficControlConfig {
  tenantId: string;
  carts: TrafficControlCart[];
  commutes: TrafficControlCommute[];
  voices: TrafficControlVoice[];
  replacements: TrafficControlReplacement[];
  pronunciations: TrafficControlPronunciation[];
  prompts: TrafficControlPromptConfig;
  scheduler: TrafficControlScheduler;
  updatedAtIso: string;
}

export interface SaveTrafficControlConfigRequest {
  config: Omit<TrafficControlConfig, 'tenantId' | 'updatedAtIso'>;
}
