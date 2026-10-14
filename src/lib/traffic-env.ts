import 'server-only';

const TOMTOM_KEY_CANDIDATES = [
  'TOMTOM_API_KEY',
  'ODYSSEYCAST_TOMTOM_KEY',
  'TRAFFIC_TOMTOM_API_KEY',
];

// GEMINI_API_KEY is the workspace's standard name. The rest are legacy names still
// read so an existing deployment keeps working until its env is renamed.
const GEMINI_KEY_CANDIDATES = [
  'GEMINI_API_KEY',
  'GOOGLE_GENAI_API_KEY',
  'GOOGLE_GEMINI_API_KEY',
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

/**
 * The Gemini key under its standard name, from GEMINI_API_KEY or a legacy alias.
 * A key found under a legacy name is also published as GEMINI_API_KEY so every
 * later reader sees one name.
 */
export function resolveGeminiApiKey(): string | null {
  const key = pickEnv(GEMINI_KEY_CANDIDATES);
  if (!key) {
    return null;
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    process.env.GEMINI_API_KEY = key;
  }

  return key;
}

export function resolveTrafficGeminiApiKey(): string | null {
  return resolveGeminiApiKey();
}
