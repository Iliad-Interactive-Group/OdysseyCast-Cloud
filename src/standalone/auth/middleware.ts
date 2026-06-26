import type { NextRequest } from 'next/server';
import { getAuthAdmin } from '@/standalone/firebase/admin';

export interface VerifiedAuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  tenantId: string;
  role: 'superAdmin' | 'admin' | 'user';
}

const DEV_TENANT_HEADER = 'x-odyssey-tenant-context';

function resolveDevTenantId(request: NextRequest): string {
  return request.headers.get(DEV_TENANT_HEADER)?.trim() || 'iig-core';
}

function buildDevUser(request: NextRequest): VerifiedAuthUser {
  const tenantId = resolveDevTenantId(request);

  return {
    uid: 'local-dev-user',
    email: 'operator@local.dev',
    displayName: 'Odyssey Operator',
    tenantId,
    role: 'superAdmin',
  };
}

export async function verifyAuthToken(request: NextRequest): Promise<VerifiedAuthUser | null> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const isDevBypassEnabled =
    process.env.NODE_ENV !== 'production' && process.env.ODYSSEY_DEV_AUTH_BYPASS !== 'false';

  if (!authHeader?.startsWith('Bearer ')) {
    return isDevBypassEnabled ? buildDevUser(request) : null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return isDevBypassEnabled ? buildDevUser(request) : null;
  }

  const auth = getAuthAdmin();
  if (!auth) {
    return isDevBypassEnabled ? buildDevUser(request) : null;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const roleClaim = decoded.role;
    const role: VerifiedAuthUser['role'] =
      roleClaim === 'superAdmin' || roleClaim === 'admin' || roleClaim === 'user'
        ? roleClaim
        : 'user';

    return {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      tenantId:
        (typeof decoded.tenantId === 'string' && decoded.tenantId.trim()) ||
        resolveDevTenantId(request),
      role,
    };
  } catch {
    return isDevBypassEnabled ? buildDevUser(request) : null;
  }
}
