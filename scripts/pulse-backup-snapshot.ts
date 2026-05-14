#!/usr/bin/env npx tsx
// Generates a static fallback HTML from the latest Firebase state.
// Usage: npx tsx scripts/pulse-backup-snapshot.ts

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const {
  NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: databaseURL,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
} = process.env

if (!apiKey || !databaseURL) {
  console.error('❌ Firebase env vars not set.')
  process.exit(1)
}

async function run() {
  const { initializeApp } = await import('firebase/app')
  const { getDatabase, ref, get } = await import('firebase/database')
  const { getAuth, signInAnonymously } = await import('firebase/auth')

  const app = initializeApp({ apiKey, authDomain, databaseURL, projectId })
  const db = getDatabase(app)
  await signInAnonymously(getAuth(app))

  const [eventSnap, sessSnap] = await Promise.all([
    get(ref(db, 'event')),
    get(ref(db, 'sessions')),
  ])

  const event = eventSnap.val() as { activeSessionId?: string } | null
  const sessionId = event?.activeSessionId
  if (!sessionId) { console.error('No active session'); process.exit(1) }

  const votesSnap = await get(ref(db, `votes/${sessionId}`))
  const votes = (votesSnap.val() as Record<string, number>) ?? {}

  const template = fs.readFileSync(path.join(__dirname, '..', 'public', 'pulse-fallback.html'), 'utf8')
  const tagRows = Object.entries(votes)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => `<div>${id}: ${count}</div>`)
    .join('\n        ')

  const output = template
    .replace('<span id="gen-time"></span>', new Date().toLocaleString('ru-RU'))
    .replace(/<div id="top-tags">[\s\S]*?<\/div>(?=\s*<\/div>)/, `<div id="top-tags">\n        ${tagRows}\n      </div>`)

  const outPath = path.join(__dirname, '..', 'public', `pulse-snapshot-${Date.now()}.html`)
  fs.writeFileSync(outPath, output)
  console.log(`✅ Snapshot saved to ${path.basename(outPath)}`)
  process.exit(0)
}

run().catch((err) => { console.error(err); process.exit(1) })
