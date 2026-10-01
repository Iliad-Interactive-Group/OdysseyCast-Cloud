import 'server-only';

import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function resolveCredential() {
  const serviceAccount = parseServiceAccount();
  if (serviceAccount) {
    return cert(serviceAccount);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return applicationDefault();
}

let cachedApp: App | null = null;

function getFirebaseAdminApp(): App {
  if (cachedApp) {
    return cachedApp;
  }

  const existing = getApps().find((app) => app.name === '[DEFAULT]');
  if (existing) {
    cachedApp = existing;
    return cachedApp;
  }

  cachedApp = initializeApp({
    credential: resolveCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return cachedApp;
}

export function getFirestoreAdmin() {
  return getFirestore(getFirebaseAdminApp());
}

export function getStorageAdmin() {
  return getStorage(getFirebaseAdminApp());
}

// Users authenticate against the central iig-core Firebase Auth hub. ID-token
// verification only needs the iig-core project ID (Google's public signing
// keys), so it runs on a separate named Admin app; app data stays in the
// default app above (this app's own Firestore project).
export const IIG_CORE_AUTH_PROJECT_ID = 'iig-core';
const IIG_CORE_AUTH_APP_NAME = 'iig-core-auth';

function getIigCoreAuthApp(): App {
  try {
    return getApp(IIG_CORE_AUTH_APP_NAME);
  } catch {
    return initializeApp(
      { credential: resolveCredential(), projectId: IIG_CORE_AUTH_PROJECT_ID },
      IIG_CORE_AUTH_APP_NAME,
    );
  }
}

export function getIigCoreAuthAdmin() {
  try {
    return getAuth(getIigCoreAuthApp());
  } catch {
    return null;
  }
}
