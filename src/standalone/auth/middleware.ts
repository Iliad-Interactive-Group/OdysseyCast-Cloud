import 'server-only';

import type { NextRequest } from 'next/server';
import { getFirestoreAdmin, getIigCoreAuthAdmin } from '@/standalone/firebase/admin';

export type OdysseyRole = 'superAdmin' | 'admin' | 'user';

export interface VerifiedAuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  /** Active tenant for this request. null = no tenant provisioned (no data access). */
  tenantId: string | null;
  /** Every tenant this user may act in (from the app DB access record). */
  tenantIds: string[];
  role: OdysseyRole;
}

/**
 * Per-user access records live in this app's own Firestore project
 * (never in iig-core): `users/{uid}` = { role, tenantId, tenantIds?, disabled? }.
 * A verified iig-core user with no record gets least privilege:
 * role `user`, no tenant, so every tenant-scoped API refuses them.
 */
export const ODYSSEY_USERS_COLLECTION = 'users';

/** Optional: pick one of the caller's allowed tenants. Never grants access by itself. */
export const TENANT_SELECTION_HEADER = 'x-odyssey-tenant-context';

function readBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = header.slice('bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function normalizeRole(value: unknown): OdysseyRole {
  return value === 'superAdmin' || value === 'admin' || value === 'user' ? value : 'user';
}

function normalizeTenantIds(primary: unknown, list: unknown): string[] {
  const ids = new Set<string>();
  if (typeof primary === 'string' && primary.trim()) {
    ids.add(primary.trim());
  }
  if (Array.isArray(list)) {
    for (const item of list) {
      if (typeof item === 'string' && item.trim()) {
        ids.add(item.trim());
      }
    }
  }
  return [...ids];
}

/**
 * Verifies the iig-core Firebase ID token from `Authorization: Bearer` and
 * resolves role/tenant from the app DB. Fails closed: any missing token,
 * invalid token, missing config or lookup error returns null.
 */
export async function verifyAuthToken(request: NextRequest): Promise<VerifiedAuthUser | null> {
  const token = readBearerToken(request);
  if (!token) {
    return null;
  }

  const auth = getIigCoreAuthAdmin();
  if (!auth) {
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(token);

    const snapshot = await getFirestoreAdmin()
      .collection(ODYSSEY_USERS_COLLECTION)
      .doc(decoded.uid)
      .get();
    const record = snapshot.exists ? (snapshot.data() ?? {}) : {};

    if (record.disabled === true) {
      return null;
    }

    const tenantIds = normalizeTenantIds(record.tenantId, record.tenantIds);
    const requestedTenant = request.headers.get(TENANT_SELECTION_HEADER)?.trim();
    const tenantId =
      requestedTenant && tenantIds.includes(requestedTenant)
        ? requestedTenant
        : (tenantIds[0] ?? null);

    return {
      uid: decoded.uid,
      email: decoded.email,
      displayName: typeof decoded.name === 'string' ? decoded.name : undefined,
      tenantId,
      tenantIds,
      role: snapshot.exists ? normalizeRole(record.role) : 'user',
    };
  } catch {
    return null;
  }
}
