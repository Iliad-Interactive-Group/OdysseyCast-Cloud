import 'server-only';

const TOMTOM_KEY_CANDIDATES = [
  'TOMTOM_API_KEY',
  'ODYSSEYCAST_TOMTOM_KEY',
  'TRAFFIC_TOMTOM_API_KEY',
];

const GEMINI_KEY_CANDIDATES = [
  'GOOGLE_GENAI_API_KEY',
  'ODYSSEYCAST_TRAFFIC_GEMINI_KEY',
  'TRAFFIC_GOOGLE_GENAI_API_KEY',
  'GOOGLE_API_KEY',
];

function pickEnv(candidates: string[]): string | null {
  for (const name of candidates) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export function resolveTrafficTomTomApiKey(): string | null {
  return pickEnv(TOMTOM_KEY_CANDIDATES);
}

export function resolveTrafficGeminiApiKey(): string | null {
  const key = pickEnv(GEMINI_KEY_CANDIDATES);
  if (!key) {
    return null;
  }

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    process.env.GOOGLE_GENAI_API_KEY = key;
  }

  return key;
}
