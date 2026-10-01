'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Central auth hub. Users sign in to iig-core; the server verifies the
// iig-core ID token and resolves role/tenant from this app's own database.
const IIG_CORE_PROJECT_ID = 'iig-core';
const AUTH_APP_NAME = 'iig-core';
const TENANT_STORAGE_KEY = 'odyssey-tenant-context';
const TENANT_SELECTION_HEADER = 'x-odyssey-tenant-context';
export const LOGIN_PATH = '/login';

export type OdysseyRole = 'superAdmin' | 'admin' | 'user';

export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  /** Resolved by the server from the app DB; null until loaded or when not provisioned. */
  tenantId: string | null;
  tenantIds: string[];
  role: OdysseyRole;
}

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'misconfigured';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  user: null,
  refreshAccess: async () => undefined,
});

// NEXT_PUBLIC_* must be referenced literally so Next inlines them.
function readFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Fail closed: incomplete config or a project other than iig-core means no sign-in.
  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.appId ||
    config.projectId !== IIG_CORE_PROJECT_ID
  ) {
    return null;
  }

  return config;
}

let cachedAuth: Auth | null | undefined;

export function getClientAuth(): Auth | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (cachedAuth !== undefined) {
    return cachedAuth;
  }

  const config = readFirebaseConfig();
  if (!config) {
    cachedAuth = null;
    return cachedAuth;
  }

  const app: FirebaseApp = getApps().some((item) => item.name === AUTH_APP_NAME)
    ? getApp(AUTH_APP_NAME)
    : initializeApp(config, AUTH_APP_NAME);
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export async function getIdToken(): Promise<string | null> {
  const auth = getClientAuth();
  if (!auth) {
    return null;
  }
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export function getSelectedTenantId(): string | null {
  try {
    return window.localStorage.getItem(TENANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSelectedTenantId(tenantId: string): void {
  try {
    window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  } catch {
    // Ignore storage access failures.
  }
}

/**
 * fetch() with the iig-core ID token attached. The tenant header only picks
 * among tenants the server already allows for this user.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? {});
  const token = await getIdToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const tenantId = getSelectedTenantId();
  if (tenantId) {
    headers.set(TENANT_SELECTION_HEADER, tenantId);
  }

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, { ...init, headers });
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getClientAuth();
  if (!auth) {
    throw new Error('Sign-in is not configured.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const auth = getClientAuth();
  if (!auth) {
    throw new Error('Sign-in is not configured.');
  }
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  const auth = getClientAuth();
  if (auth) {
    await firebaseSignOut(auth);
  }
}

interface AccessPayload {
  role: OdysseyRole;
  tenantId: string | null;
  tenantIds: string[];
}

async function loadAccess(): Promise<AccessPayload | null> {
  try {
    const response = await authFetch('/api/auth/me', { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AccessPayload;
  } catch {
    return null;
  }
}

function toAuthUser(firebaseUser: User, access: AccessPayload | null): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? undefined,
    displayName: firebaseUser.displayName ?? undefined,
    tenantId: access?.tenantId ?? null,
    tenantIds: access?.tenantIds ?? [],
    role: access?.role ?? 'user',
  };
}

function FullScreenMessage({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold">{title}</p>
        {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [access, setAccess] = useState<AccessPayload | null>(null);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      setStatus('misconfigured');
      return;
    }

    return onIdTokenChanged(auth, (nextUser) => {
      setFirebaseUser(nextUser);
      if (!nextUser) {
        setAccess(null);
        setStatus('signedOut');
        return;
      }
      setStatus('signedIn');
    });
  }, []);

  const uid = firebaseUser?.uid ?? null;

  const refreshAccess = useCallback(async () => {
    setAccess(await loadAccess());
  }, []);

  useEffect(() => {
    if (uid) {
      void refreshAccess();
    }
  }, [uid, refreshAccess]);

  const isLoginRoute = pathname === LOGIN_PATH;

  useEffect(() => {
    if (status === 'signedOut' && !isLoginRoute) {
      const next = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`${LOGIN_PATH}${next}`);
    }
  }, [status, isLoginRoute, pathname, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: firebaseUser ? toAuthUser(firebaseUser, access) : null,
      refreshAccess,
    }),
    [status, firebaseUser, access, refreshAccess],
  );

  let content: ReactNode = children;
  if (!isLoginRoute) {
    if (status === 'misconfigured') {
      content = (
        <FullScreenMessage
          title="Sign-in is not configured"
          detail="Set the NEXT_PUBLIC_FIREBASE_* variables for the iig-core project."
        />
      );
    } else if (status !== 'signedIn') {
      content = <FullScreenMessage title="Checking sign-in..." />;
    }
  }

  return <AuthContext.Provider value={value}>{content}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
