import admin from 'firebase-admin'
import { requireAdminApp } from '../firebase/admin-app'

export function requireAdminDb(): admin.database.Database {
  return requireAdminApp().database()
}

export async function rtdbRead(path: string): Promise<unknown> {
  const snap = await requireAdminDb().ref(path).once('value')
  return snap.val()
}

export async function rtdbWrite(path: string, value: unknown): Promise<void> {
  await requireAdminDb().ref(path).set(value)
}
