/**
 * Relay of server-side errors to the iig control plane (App-SIEM) ingest endpoint
 * (POST <CONTROL_PLANE_URL>/api/ingest, header x-app-siem-key), per
 * iig-control-plane/docs/control-plane.md. Same contract as the other Iliad apps.
 *
 * Fails closed: if the key or URL is missing/invalid, nothing is sent. Never throws into the caller's
 * request path. Pure module (no Next/Firebase imports) so it can be unit-tested.
 *
 * Env (server-only, runtime):
 *   APP_SIEM_KEY       shared ingest key (secret). Legacy fallback: ERROR_REPORT_SECRET.
 *   CONTROL_PLANE_URL  base URL, e.g. https://ops.iliadinteractive.com.
 *                      Legacy fallbacks: NEXT_PUBLIC_CONTROL_PLANE_URL, CONTROL_PLANE_ISSUES_URL,
 *                      GROWTHOS_CONTROL_PLANE_URL.
 */

export const APP_NAME = 'OdysseyCast-Cloud';
/** Must match the control plane's minimum (packages/admin-auth MIN_INGEST_KEY_LENGTH). */
export const MIN_INGEST_KEY_LENGTH = 24;
/** Publicly known placeholder that was shipped as a default in several repos. Never send it. */
const KNOWN_PLACEHOLDER_KEYS = new Set(['iliad-control-plane-secret']);
const INGEST_PATH = '/api/ingest';
const TIMEOUT_MS = 5000;

type Env = Record<string, string | undefined>;

export type ControlPlaneSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ControlPlaneConfig {
  ingestUrl: string;
  key: string;
}

export interface ControlPlaneEvent {
  message: string;
  severity?: ControlPlaneSeverity;
  route?: string;
  url?: string;
  stack?: string;
  name?: string;
  httpStatus?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

function firstNonEmpty(env: Env, names: string[]): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Turns a base URL (or a legacy full /api/ingest or /api/issues URL) into the ingest endpoint. */
export function buildIngestUrl(raw: string, env: Env = process.env): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) return null;
  if (isLocal && env.NODE_ENV === 'production') return null;

  const base = parsed.pathname.replace(/\/+$/, '').replace(/\/api\/(ingest|issues)$/, '');
  return `${parsed.origin}${base}${INGEST_PATH}`;
}

/** Returns the relay config, or null (with the reason) when the relay must be skipped. */
export function resolveControlPlaneConfig(
  env: Env = process.env
): { ok: true; config: ControlPlaneConfig } | { ok: false; reason: string } {
  const key = firstNonEmpty(env, ['APP_SIEM_KEY', 'ERROR_REPORT_SECRET']);
  const rawUrl = firstNonEmpty(env, [
    'CONTROL_PLANE_URL',
    'NEXT_PUBLIC_CONTROL_PLANE_URL',
    'CONTROL_PLANE_ISSUES_URL',
    'GROWTHOS_CONTROL_PLANE_URL',
  ]);

  if (!key) return { ok: false, reason: 'APP_SIEM_KEY is not set' };
  if (KNOWN_PLACEHOLDER_KEYS.has(key)) return { ok: false, reason: 'APP_SIEM_KEY is a public placeholder' };
  if (key.length < MIN_INGEST_KEY_LENGTH) return { ok: false, reason: 'APP_SIEM_KEY is too short' };
  if (!rawUrl) return { ok: false, reason: 'CONTROL_PLANE_URL is not set' };

  const ingestUrl = buildIngestUrl(rawUrl, env);
  if (!ingestUrl) return { ok: false, reason: 'CONTROL_PLANE_URL is not a valid https URL' };

  return { ok: true, config: { ingestUrl, key } };
}

const warned = new Set<string>();
function warnOnce(reason: string) {
  if (warned.has(reason)) return;
  warned.add(reason);
  console.warn(`[control-plane] Relay disabled: ${reason}.`);
}

export function buildIngestPayload(event: ControlPlaneEvent, env: Env = process.env, now = new Date()) {
  const timestamp = now.toISOString();
  return {
    events: [
      {
        id: `odysseycast-cloud-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'error',
        severity: event.severity ?? 'high',
        channel: 'node',
        message: event.message,
        stack: event.stack,
        name: event.name,
        httpStatus: event.httpStatus,
        route: event.route,
        url: event.url,
        timestamp,
        app: {
          appName: APP_NAME,
          environment: env.APP_ENV || env.NODE_ENV || 'production',
          owner: 'ops',
          region: 'Next.js server',
        },
        auth: event.userId ? { userId: event.userId } : undefined,
        metadata: event.metadata,
      },
    ],
    sentAt: timestamp,
  };
}

/**
 * Sends one event to the control plane. Resolves to true only on a 2xx response.
 * Never throws; a missing config or a network failure just logs a warning.
 */
export async function reportToControlPlane(
  event: ControlPlaneEvent,
  deps: { env?: Env; fetch?: typeof fetch } = {}
): Promise<boolean> {
  try {
    const env = deps.env ?? process.env;
    const resolved = resolveControlPlaneConfig(env);
    if (!resolved.ok) {
      warnOnce(resolved.reason);
      return false;
    }
    const doFetch = deps.fetch ?? fetch;
    const response = await doFetch(resolved.config.ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-siem-key': resolved.config.key,
      },
      body: JSON.stringify(buildIngestPayload(event, env)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[control-plane] Ingest rejected the event (HTTP ${response.status}).`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[control-plane] Relay failed:', error instanceof Error ? error.message : 'unknown error');
    return false;
  }
}

/** Convenience for catch blocks: reports an unknown error without awaiting the caller. */
export function reportServerError(error: unknown, context: Omit<ControlPlaneEvent, 'message' | 'stack' | 'name'> = {}) {
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown server error');
  return reportToControlPlane({
    ...context,
    message: `[OdysseyCast-Cloud] ${err.message}`.slice(0, 2000),
    stack: err.stack?.slice(0, 8000),
    name: err.name,
  });
}
