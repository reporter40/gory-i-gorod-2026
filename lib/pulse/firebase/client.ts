// Firebase singleton — lazy init, one app instance for the whole app.
// TODO: Set NEXT_PUBLIC_FIREBASE_* env vars in .env.local before use.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

const REQUIRED_ENV = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const

function hasFirebaseConfig(): boolean {
  return REQUIRED_ENV.every((k) => !!process.env[k])
}

export { hasFirebaseConfig }

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp()

  if (!hasFirebaseConfig()) {
    throw new Error(
      'Firebase env vars not set. Set NEXT_PUBLIC_FIREBASE_API_KEY, ' +
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_DATABASE_URL, ' +
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local'
    )
  }

  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export function getFirebaseDb(): Database {
  return getDatabase(getFirebaseApp())
}

let cachedUserId: string | null = null

export async function ensureAnonymousAuth(): Promise<string> {
  if (cachedUserId) return cachedUserId

  const auth = getAuth(getFirebaseApp())
  if (auth.currentUser) {
    cachedUserId = auth.currentUser.uid
    return cachedUserId
  }

  const cred = await signInAnonymously(auth)
  cachedUserId = cred.user.uid
  return cachedUserId
}
