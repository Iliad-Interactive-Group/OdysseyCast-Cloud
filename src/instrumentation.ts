/**
 * Next.js server hooks. onRequestError sees every error Next.js catches while
 * rendering or running a route handler, server action or middleware, and relays it
 * to the control plane. The relay never throws and is skipped when APP_SIEM_KEY or
 * CONTROL_PLANE_URL is missing (src/lib/control-plane.ts).
 */
export function register() {
  // Nothing to set up; the relay reads env per call.
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { reportServerError } = await import('@/lib/control-plane');
  await reportServerError(error, {
    route: context.routePath,
    url: request.path,
    metadata: { method: request.method, routerKind: context.routerKind, routeType: context.routeType },
  });
}
