'use client'

// Vote client — Strategy A: server POST /api/pulse/vote (Firebase ID token).
// Local checks: frozen → rate_limited → localStorage duplicate → offline → API.

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

function browserOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

async function getVoteIdToken(): Promise<string | null> {
  try {
    const { hasFirebaseConfig, ensureAnonymousAuth, getFirebaseAuth } = await import('./firebase/client')
    if (!hasFirebaseConfig()) return null
    await ensureAnonymousAuth()
    const u = getFirebaseAuth().currentUser
    if (!u) return null
    return await u.getIdToken()
  } catch {
    return null
  }
}

function mapVoteResponse(res: Response, data: { ok?: boolean; status?: string; message?: string }): VoteResult | null {
  if (res.ok && data.ok && data.status === 'voted') {
    return { ok: true, status: 'voted' }
  }
  if (res.status === 423 || data.status === 'frozen') {
    return { ok: false, status: 'frozen' }
  }
  if (res.status === 409 || data.status === 'duplicate') {
    return { ok: false, status: 'duplicate' }
  }
  if (res.status === 503) {
    return { ok: false, status: 'error', message: data.message ?? 'Server vote unavailable' }
  }
  if (res.status === 401) {
    return { ok: false, status: 'error', message: data.message ?? 'unauthorized' }
  }
  if (!data.ok || data.status === 'error') {
    return { ok: false, status: 'error', message: data.message ?? `vote failed (${res.status})` }
  }
  return null
}

async function submitVoteViaApi(sessionId: string, tagId: string): Promise<VoteResult> {
  const token = await getVoteIdToken()
  if (!token) {
    return { ok: false, status: 'error', message: 'Firebase auth unavailable' }
  }

  let res: Response
  try {
    res = await fetch('/api/pulse/vote', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, tagId }),
    })
  } catch {
    return { ok: false, status: 'offline', queued: false }
  }

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    status?: string
    message?: string
  }

  const mapped = mapVoteResponse(res, data)
  if (mapped) return mapped

  return { ok: false, status: 'error', message: data.message ?? `unexpected response (${res.status})` }
}

export async function voteForTag(input: {
  sessionId: string
  tagId: string
  userId: string
}): Promise<VoteResult> {
  const { sessionId, tagId, userId } = input

  if (!sessionId || !tagId || !userId) {
    const missing = [!sessionId && 'sessionId', !tagId && 'tagId', !userId && 'userId'].filter(Boolean).join(', ')
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PulseVote] rejected — missing required fields:', missing)
    }
    return { ok: false, status: 'error', message: `missing required fields: ${missing}` }
  }

  const { hasFirebaseConfig } = await import('./firebase/client')
  if (!hasFirebaseConfig()) {
    return { ok: false, status: 'error', message: 'Firebase not configured' }
  }

  if (process.env.NODE_ENV === 'development') {
    console.group('[PulseVote]')
    console.log('participantId:', userId)
    console.log('sessionId:', sessionId)
    console.log('tagId:', tagId)
    console.groupCollapsed('call stack')
    console.trace()
    console.groupEnd()
  }

  if (await isFrozen()) {
    if (process.env.NODE_ENV === 'development') console.groupEnd()
    return { ok: false, status: 'frozen' }
  }

  const rateCheck = checkRateLimit(userId)
  if (rateCheck.limited) {
    if (process.env.NODE_ENV === 'development') console.groupEnd()
    return { ok: false, status: 'rate_limited', retryAfter: rateCheck.retryAfter }
  }

  if (hasVotedLocally(sessionId, tagId, userId)) {
    if (process.env.NODE_ENV === 'development') console.groupEnd()
    return { ok: false, status: 'duplicate' }
  }

  if (!browserOnline()) {
    const eventId = makeEventId(userId, sessionId, tagId)
    enqueueVote({ sessionId, tagId, userId, eventId })
    if (process.env.NODE_ENV === 'development') {
      console.log('writeResult: queued offline, eventId:', eventId)
      console.groupEnd()
    }
    return { ok: false, status: 'offline', queued: true }
  }

  const result = await submitVoteViaApi(sessionId, tagId)

  if (result.ok && result.status === 'voted') {
    markVotedLocally(sessionId, tagId, userId)
    recordVote(userId)
    if (process.env.NODE_ENV === 'development') {
      console.log('writeResult: ok — voted via API')
      console.groupEnd()
    }
    return result
  }

  if (result.ok === false && result.status === 'duplicate') {
    markVotedLocally(sessionId, tagId, userId)
    if (process.env.NODE_ENV === 'development') {
      console.log('writeResult: duplicate')
      console.groupEnd()
    }
    return result
  }

  if (result.ok === false && result.status === 'offline' && !result.queued) {
    const eventId = makeEventId(userId, sessionId, tagId)
    enqueueVote({ sessionId, tagId, userId, eventId })
    if (process.env.NODE_ENV === 'development') {
      console.log('writeResult: network error — queued offline')
      console.groupEnd()
    }
    return { ok: false, status: 'offline', queued: true }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('writeResult:', result)
    console.groupEnd()
  }
  return result
}

export async function flushOfflineQueue(): Promise<void> {
  const queue = getQueue()
  if (queue.length === 0) return

  if (!browserOnline()) return
  if (await isFrozen()) return

  const { hasFirebaseConfig } = await import('./firebase/client')
  if (!hasFirebaseConfig()) return

  for (const item of queue) {
    if (hasVotedLocally(item.sessionId, item.tagId, item.userId)) {
      removeFromQueue(item)
      continue
    }
    const result = await submitVoteViaApi(item.sessionId, item.tagId)
    if (result.ok && result.status === 'voted') {
      markVotedLocally(item.sessionId, item.tagId, item.userId)
      recordVote(item.userId)
      removeFromQueue(item)
      continue
    }
    if (result.ok === false && result.status === 'duplicate') {
      markVotedLocally(item.sessionId, item.tagId, item.userId)
      removeFromQueue(item)
      continue
    }
    if (result.ok === false && result.status === 'offline') {
      break
    }
  }
}
