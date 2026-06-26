import 'server-only';

interface GenerateParams {
  model: string;
  system: string;
  prompt: string;
  config?: {
    temperature?: number;
  };
}

function getGeminiApiKey(): string {
  const key = process.env.GOOGLE_GENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('GOOGLE_GENAI_API_KEY is required for text generation.');
  }

  return key;
}

export function getGoogleAiTextModelByLane(lane: 'flash' | 'pro' | string): string {
  void lane;
  return process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
}

export function getGeminiPrimaryModelId(kind: 'tts' | 'text'): string {
  if (kind === 'tts') {
    return process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
  }

  return process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
}

export function applyPronunciationGuides(text: string, guides: Record<string, string>): string {
  void guides;
  return text;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildBroadcastSsml(text: string, voice: string | null): string {
  void voice;
  return `<speak>${escapeXml(text)}</speak>`;
}

export function getGenkitInstance() {
  return {
    async generate(params: GenerateParams): Promise<{ text: string }> {
      const key = getGeminiApiKey();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              role: 'system',
              parts: [{ text: params.system }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: params.prompt }],
              },
            ],
            generationConfig: {
              temperature: params.config?.temperature ?? 0.35,
            },
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini generation failed (${response.status}): ${detail}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const text = payload.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim();

      if (!text) {
        throw new Error('Gemini generation returned empty output.');
      }

      return { text };
    },
  };
}
