import 'server-only';
import { NextRequest } from 'next/server';

function normalizeHost(host: string): string {
  const trimmed = host.trim();
  const withoutPort = trimmed.startsWith('[')
    ? trimmed.replace(/^\[([^\]]+)\](?::\d+)?$/, '$1')
    : trimmed.split(':')[0];

  return withoutPort.toLowerCase();
}

function isLoopbackHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function isLoopbackIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1'
  );
}

function getCandidateIps(request: NextRequest): string[] {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  const ips: string[] = [];

  if (forwardedFor) {
    ips.push(
      ...forwardedFor
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }

  if (realIp) {
    ips.push(realIp.trim());
  }

  return ips;
}

export function isLocalOnlyRequest(request: NextRequest): boolean {
  const hostHeader = request.headers.get('host');
  if (!hostHeader || !isLoopbackHost(hostHeader)) {
    return false;
  }

  const candidateIps = getCandidateIps(request);
  if (candidateIps.length === 0) {
    return true;
  }

  return candidateIps.every(isLoopbackIp);
}
