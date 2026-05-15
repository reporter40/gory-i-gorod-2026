/**
 * Firebase Admin — RTDB + Auth verifyIdToken (server-only).
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string of service account).
 */

import admin from 'firebase-admin'

let cachedApp: admin.app.App | null | undefined

export function getAdminApp(): admin.app.App | null {
  if (cachedApp !== undefined) return cachedApp

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const dbUrl =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

  if (!raw || !dbUrl) {
    cachedApp = null
    return null
  }

  try {
    const credJson = JSON.parse(raw) as admin.ServiceAccount
    cachedApp = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(credJson),
          databaseURL: dbUrl,
        })
    return cachedApp
  } catch {
    cachedApp = null
    return null
  }
}

export function requireAdminApp(): admin.app.App {
  const app = getAdminApp()
  if (!app) {
    throw new Error(
      'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_DATABASE_URL (or NEXT_PUBLIC_FIREBASE_DATABASE_URL).'
    )
  }
  return app
}
