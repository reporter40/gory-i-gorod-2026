'use client'

// Vote client — single entry point for all voting operations.
// Check order: frozen → rate_limited → localStorage duplicate → offline → Firebase transaction

import { checkRateLimit, recordVote } from './reliability/rateLimiter'
import { enqueueVote, getQueue, removeFromQueue, makeEventId } from './reliability/offlineQueue'

export type VoteResult =
  | { ok: true; status: 'voted' }
  | { ok: false; status: 'duplicate' }
  | { ok: false; status: 'offline'; queued: boolean }
  | { ok: false; status: 'rate_limited'; retryAfter: number }
  | { ok: false; status: 'frozen' }
  | { ok: false; status: 'error'; message: string }

function dedupeKey(sessionId: string, tagId: string, userId: string): string {
  return `pulse_voted_${sessionId}_${tagId}_${userId}`
}

function hasVotedLocally(sessionId: string, tagId: string, userId: string): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(dedupeKey(sessionId, tagId, userId)) === '1'
}

function markVotedLocally(sessionId: string, tagId: string, userId: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(dedupeKey(sessionId, tagId, userId), '1')
}

async function isFrozen(): Promise<boolean> {
  try {
    const { hasFirebaseConfig, getFirebaseDb } = await import('./firebase/client')
    if (!hasFirebaseConfig()) return false
    const { ref, get } = await import('firebase/database')
    const db = getFirebaseDb()
    const snap = await get(ref(db, 'event/frozen'))
    return !!snap.val()
  } catch {
    return false
  }
}

async function isOnline(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false
  try {
    const { hasFirebaseConfig, getFirebaseDb } = await import('./firebase/client')
    if (!hasFirebaseConfig()) return false
    const { ref, get } = await import('firebase/database')
    const db = getFirebaseDb()
    const snap = await get(ref(db, '.info/connected'))
    return !!snap.val()
  } catch {
    return false
  }
}

async function incrementVoteTransaction(sessionId: string, tagId: string): Promise<void> {
  const { getFirebaseDb } = await import('./firebase/client')
  const { ref, runTransaction } = await import('firebase/database')
  const db = getFirebaseDb()
  const voteRef = ref(db, `votes/${sessionId}/${tagId}`)
  await runTransaction(voteRef, (current: number | null) => {
    return (current ?? 0) + 1
  })
}

async function setUserVoteMarker(sessionId: string, tagId: string, userId: string): Promise<void> {
  const { getFirebaseDb } = await import('./firebase/client')
  const { ref, set } = await import('firebase/database')
  const db = getFirebaseDb()
  const markerRef = ref(db, `userVotes/${sessionId}/${userId}/${tagId}`)
  await set(markerRef, true)
}

async function pushMoodEvent(sessionId: string, tagId: string, userId: string): Promise<void> {
  try {
    const { getFirebaseDb } = await import('./firebase/client')
    const { ref, push, serverTimestamp } = await import('firebase/database')
    const db = getFirebaseDb()
    await push(ref(db, 'mood'), {
      tagId,
      sessionId,
      userId,
      ts: serverTimestamp(),
    })
  } catch {
    // best-effort, does not block vote result
  }
}

export async function voteForTag(input: {
  sessionId: string
  tagId: string
  userId: string
}): Promise<VoteResult> {
  const { sessionId, tagId, userId } = input

  // 0. Validate required fields — never silently drop incomplete events
  if (!sessionId || !tagId || !userId) {
    const missing = [!sessionId && 'sessionId', !tagId && 'tagId', !userId && 'userId'].filter(Boolean).join(', ')
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PulseVote] rejected — missing required fields:', missing)
    }
    return { ok: false, status: 'error', message: `missing required fields: ${missing}` }
  }

  const firebasePath = `votes/${sessionId}/${tagId}`
  if (process.env.NODE_ENV === 'development') {
    console.group('[PulseVote]')
    console.log('participantId:', userId)
    console.log('sessionId:', sessionId)
    console.log('tagId:', tagId)
    console.log('firebasePath:', firebasePath)
    console.groupCollapsed('call stack')
    console.trace()
    console.groupEnd()
  }

  // 1. Check frozen
  if (await isFrozen()) {
    return { ok: false, status: 'frozen' }
  }

  // 2. Rate limiter
  const rateCheck = checkRateLimit(userId)
  if (rateCheck.limited) {
    return { ok: false, status: 'rate_limited', retryAfter: rateCheck.retryAfter }
  }

  // 3. localStorage duplicate check
  if (hasVotedLocally(sessionId, tagId, userId)) {
    return { ok: false, status: 'duplicate' }
  }

  // 4. Online check
  const online = await isOnline()
  if (!online) {
    const eventId = makeEventId(userId, sessionId, tagId)
    enqueueVote({ sessionId, tagId, userId, eventId })
    if (process.env.NODE_ENV === 'development') {
      console.log('writeResult: queued offline, eventId:', eventId)
      console.groupEnd()
    }
    return { ok: false, status: 'offline', queued: true }
  }

  try {
    // 5. Firebase transaction — atomic increment
    await incrementVoteTransaction(sessionId, tagId)

    // 6. Set userVotes marker (dedupe at Firebase level)
    await setUserVoteMarker(sessionId, tagId, userId)

    // 7. Mark locally
    markVotedLocally(sessionId, tagId, userId)
    recordVote(userId)

    // 8. Push mood event (best-effort)
    pushMoodEvent(sessionId, tagId, userId)

    if (process.env.NODE_ENV === 'development') {
      console.log('writeResult: ok — voted, path:', firebasePath)
      console.groupEnd()
    }
    return { ok: true, status: 'voted' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Firebase rules blocked duplicate → treat as duplicate
    if (msg.includes('PERMISSION_DENIED')) {
      markVotedLocally(sessionId, tagId, userId)
      if (process.env.NODE_ENV === 'development') { console.log('writeResult: duplicate (PERMISSION_DENIED)'); console.groupEnd() }
      return { ok: false, status: 'duplicate' }
    }
    if (process.env.NODE_ENV === 'development') { console.error('writeResult: error', msg); console.groupEnd() }
    return { ok: false, status: 'error', message: msg }
  }
}

// Flush offline queue on reconnect
export async function flushOfflineQueue(): Promise<void> {
  const queue = getQueue()
  if (queue.length === 0) return

  const online = await isOnline()
  if (!online) return

  if (await isFrozen()) return

  for (const item of queue) {
    // Re-check dedupe before sending
    if (hasVotedLocally(item.sessionId, item.tagId, item.userId)) {
      removeFromQueue(item)
      continue
    }
    try {
      await incrementVoteTransaction(item.sessionId, item.tagId)
      await setUserVoteMarker(item.sessionId, item.tagId, item.userId)
      markVotedLocally(item.sessionId, item.tagId, item.userId)
      recordVote(item.userId)
      removeFromQueue(item)
    } catch {
      // leave in queue, retry next time
    }
  }
}
