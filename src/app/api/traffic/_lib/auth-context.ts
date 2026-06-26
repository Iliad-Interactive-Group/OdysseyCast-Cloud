import { verifyAuthToken, type VerifiedAuthUser } from '@iliad/auth/middleware';
import { NextRequest } from 'next/server';

export interface TrafficApiAuthContext {
  tenantId: string;
  user: VerifiedAuthUser | null;
  isDevFallback: boolean;
}

const DEV_TENANT_HEADER = 'x-odyssey-tenant-context';

function normalizeDevTenantContext(value: string | null): string | null {
  if (!value || value.trim().length === 0) {
    return 'iig-core';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'station-kjot') {
    return 'iig-core';
  }

  if (normalized === 'iig-core' || normalized === 'odyssey-rollout') {
    return normalized;
  }

  return null;
}

export async function resolveTrafficApiAuthContext(
  request: NextRequest,
): Promise<TrafficApiAuthContext | null> {
  const authUser = await verifyAuthToken(request);
  if (authUser?.tenantId) {
    return {
      tenantId: authUser.tenantId,
      user: authUser,
      isDevFallback: false,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const devTenantId = normalizeDevTenantContext(request.headers.get(DEV_TENANT_HEADER));
  if (!devTenantId) {
    return null;
  }

  return {
    tenantId: devTenantId,
    user: null,
    isDevFallback: true,
  };
}
