'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  tenantId: string;
  role: 'superAdmin' | 'admin' | 'user';
}

interface AuthContextValue {
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue>({ user: null });

function resolveDefaultTenant(): string {
  return process.env.NEXT_PUBLIC_ODYSSEY_DEFAULT_TENANT || 'iig-core';
}

function resolveDevUser(): AuthUser | null {
  if (process.env.NEXT_PUBLIC_ODYSSEY_DEV_AUTH === 'false') {
    return null;
  }

  return {
    uid: 'local-dev-user',
    email: 'operator@local.dev',
    displayName: 'Odyssey Operator',
    tenantId: resolveDefaultTenant(),
    role: 'superAdmin',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthContextValue>(() => ({ user: resolveDevUser() }), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}

export async function getIdToken(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_ODYSSEY_DEV_AUTH === 'false') {
    return null;
  }

  return 'odyssey-dev-token';
}
