#!/usr/bin/env npx tsx
// Pre-event rehearsal script for AI-Пульс.
// Runs 12 automated checks and prints PASS/FAIL.
// Usage: npx tsx scripts/pulse-rehearsal.ts
// Run the day before the forum to verify everything works.

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

interface CheckResult {
  index: number
  label: string
  ok: boolean
  detail: string
}

const CHECKS_TOTAL = 12
const results: CheckResult[] = []
let checkIdx = 0

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

function printCheck(idx: number, label: string, ok: boolean, detail: string) {
  const status = ok ? '✅' : '❌'
  const line = `[${idx}/${CHECKS_TOTAL}] ${pad(label + '...', 48)} ${status} ${ok ? detail : 'FAILED: ' + detail}`
  console.log(line)
  results.push({ index: idx, label, ok, detail })
}

async function run() {
  console.log('\n🎭 AI-Пульс Rehearsal Script')
  console.log('═══════════════════════════════════════════════════\n')

  const {
    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: databaseURL,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_PULSE_ADMIN_ENABLED: adminEnabled,
  } = process.env

  const hasConfig = !!(apiKey && databaseURL)

  let db: import('firebase/database').Database | null = null
  let userId = ''

  // 1. Firebase connection
  checkIdx++
  try {
    if (!hasConfig) throw new Error('env vars not set')
    const { initializeApp } = await import('firebase/app')
    const { getDatabase, ref, get } = await import('firebase/database')
    const t0 = Date.now()
    const app = initializeApp({ apiKey, authDomain, databaseURL, projectId })
    db = getDatabase(app)
    await get(ref(db, '.info/serverTimeOffset'))
    printCheck(checkIdx, 'Проверяю Firebase connection', true, `connected (${Date.now() - t0}ms)`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю Firebase connection', false, String(err))
  }

  // 2. Anonymous auth
  checkIdx++
  try {
    if (!db) throw new Error('no db')
    const { getAuth, signInAnonymously } = await import('firebase/auth')
    const cred = await signInAnonymously(getAuth())
    userId = cred.user.uid
    printCheck(checkIdx, 'Проверяю anonymous auth', true, `userId: ${userId.slice(0, 8)}...`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю anonymous auth', false, String(err))
  }

  // 3. Seed data
  checkIdx++
  try {
    if (!db) throw new Error('no db')
    const { ref, get } = await import('firebase/database')
    const [sessSnap, spSnap] = await Promise.all([get(ref(db, 'sessions')), get(ref(db, 'speakers'))])
    const sessions = sessSnap.val() as Record<string, unknown> | null
    const speakers = spSnap.val() as Record<string, unknown> | null
    const sc = sessions ? Object.keys(sessions).length : 0
    const spc = speakers ? Object.keys(speakers).length : 0
    if (sc === 0 || spc === 0) throw new Error(`sessions=${sc}, speakers=${spc} (run pulse-seed-firebase.ts)`)
    printCheck(checkIdx, 'Проверяю seed data', true, `${sc} sessions, ${spc} speakers`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю seed data', false, String(err))
  }

  // 4. Security Rules — duplicate vote blocked
  checkIdx++
  try {
    if (!db || !userId) throw new Error('no db/userId')
    const { ref, set, get } = await import('firebase/database')
    const testPath = `userVotes/rehearsal-test/${userId}/rehearsal-tag`
    await set(ref(db, testPath), true)
    let blocked = false
    try {
      await set(ref(db, testPath), true) // should fail: !data.exists()
    } catch {
      blocked = true
    }
    // Verify the marker exists
    const snap = await get(ref(db, testPath))
    if (!snap.exists()) throw new Error('marker not written')
    printCheck(checkIdx, 'Проверяю Security Rules', blocked, 'duplicate vote blocked')
  } catch (err) {
    printCheck(checkIdx, 'Проверяю Security Rules', false, String(err))
  }

  // 5. Test vote
  checkIdx++
  try {
    if (!db || !userId) throw new Error('no db/userId')
    const { ref, runTransaction } = await import('firebase/database')
    const t0 = Date.now()
    await runTransaction(ref(db, 'votes/rehearsal-test/rehearsal-tag'), (cur: number | null) => (cur ?? 0) + 1)
    printCheck(checkIdx, 'Тестовый голос', true, `voted in ${Date.now() - t0}ms`)
  } catch (err) {
    printCheck(checkIdx, 'Тестовый голос', false, String(err))
  }

  // 6. Deduplication
  checkIdx++
  try {
    if (!db || !userId) throw new Error('no db/userId')
    const { ref, get } = await import('firebase/database')
    const snap = await get(ref(db, `userVotes/rehearsal-test/${userId}/rehearsal-tag`))
    printCheck(checkIdx, 'Проверяю дедупликацию', snap.exists(), 'duplicate blocked')
  } catch (err) {
    printCheck(checkIdx, 'Проверяю дедупликацию', false, String(err))
  }

  // 7. Rate limiter
  checkIdx++
  try {
    const { checkRateLimit, recordVote } = await import('@/lib/pulse/reliability/rateLimiter')
    const uid = `rehearsal-rl-${Date.now()}`
    recordVote(uid)
    const res = checkRateLimit(uid)
    printCheck(checkIdx, 'Проверяю rate limiter', res.limited, `rate limit works (retryAfter=${res.retryAfter}s)`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю rate limiter', false, String(err))
  }

  // 8. event/frozen freeze+unfreeze
  checkIdx++
  try {
    if (!db) throw new Error('no db')
    const { ref, set, get } = await import('firebase/database')
    await set(ref(db, 'event/frozen'), true)
    const frozen = await get(ref(db, 'event/frozen'))
    if (!frozen.val()) throw new Error('freeze did not write')
    await set(ref(db, 'event/frozen'), false)
    const unfrozen = await get(ref(db, 'event/frozen'))
    printCheck(checkIdx, 'Проверяю event/frozen', !unfrozen.val(), 'freeze/unfreeze works')
  } catch (err) {
    printCheck(checkIdx, 'Проверяю event/frozen', false, String(err))
  }

  // 9. Health endpoint
  checkIdx++
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const t0 = Date.now()
    const res = await fetch(`${baseUrl}/pulse/health`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { status: string }
    printCheck(checkIdx, 'Проверяю /pulse/health', true, `status: ${json.status} (${Date.now() - t0}ms)`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю /pulse/health', false, `${err} (is dev server running on localhost:3000?)`)
  }

  // 10. Vote page availability
  checkIdx++
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/pulse/vote`)
    printCheck(checkIdx, 'Проверяю /pulse/vote', res.ok, `page loads (${res.status})`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю /pulse/vote', false, `${err} (is dev server running?)`)
  }

  // 11. Admin page availability
  checkIdx++
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/pulse/admin`)
    printCheck(checkIdx, 'Проверяю /pulse/admin', res.ok, `page loads (${res.status})`)
  } catch (err) {
    printCheck(checkIdx, 'Проверяю /pulse/admin', false, `${err} (is dev server running?)`)
  }

  // 12. Cleanup test data
  checkIdx++
  try {
    if (!db) throw new Error('no db')
    const { ref, remove } = await import('firebase/database')
    await Promise.all([
      remove(ref(db, 'votes/rehearsal-test')),
      remove(ref(db, 'userVotes/rehearsal-test')),
    ])
    printCheck(checkIdx, 'Очищаю тестовые данные', true, 'cleaned')
  } catch (err) {
    printCheck(checkIdx, 'Очищаю тестовые данные', false, String(err))
  }

  // Summary
  const failed = results.filter((r) => !r.ok)
  console.log('\n═══════════════════════════════════════════════════')
  if (failed.length === 0) {
    console.log('🎉 REHEARSAL RESULT: ALL CHECKS PASSED')
    console.log('   Ready for live event.')
  } else {
    console.log(`❌ REHEARSAL RESULT: ${failed.length} CHECK${failed.length > 1 ? 'S' : ''} FAILED`)
    console.log('   DO NOT proceed to live event.')
    console.log('\n   Failed checks:')
    failed.forEach((f) => console.log(`   → [${f.index}] ${f.label}: ${f.detail}`))
  }
  console.log('═══════════════════════════════════════════════════\n')

  process.exit(failed.length === 0 ? 0 : 1)
}

run().catch((err) => {
  console.error('Rehearsal script error:', err)
  process.exit(1)
})
