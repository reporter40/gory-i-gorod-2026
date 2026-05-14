import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockHasConfig = vi.hoisted(() => vi.fn(() => false))

vi.mock('@/lib/pulse/firebase/client', () => ({
  hasFirebaseConfig: () => mockHasConfig(),
  getFirebaseDb: () => ({}),
  getFirebaseAuth: () => ({
    currentUser: {
      getIdToken: vi.fn(async () => 'mock-id-token'),
    },
  }),
  ensureAnonymousAuth: vi.fn(async () => 'u-anon'),
}))

const lsStore: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => lsStore[k] ?? null,
    setItem: (k: string, v: string) => {
      lsStore[k] = v
    },
    removeItem: (k: string) => {
      delete lsStore[k]
    },
  },
  writable: true,
})

Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: false },
  writable: true,
})

import { voteForTag } from '../../lib/pulse/vote-client'
import { clearQueue } from '../../lib/pulse/reliability/offlineQueue'

beforeEach(() => {
  clearQueue()
  mockHasConfig.mockReturnValue(false)
  Object.keys(lsStore).forEach((k) => {
    delete lsStore[k]
  })
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, writable: true })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, status: 'voted' }), { status: 200 })
    )
  )
})

describe('voteForTag', () => {
  it('returns error when Firebase env not configured', async () => {
    const result = await voteForTag({ sessionId: 's1', tagId: 'implement', userId: 'u1' })
    expect(result.ok).toBe(false)
    if (result.status === 'error') {
      expect(result.message).toContain('Firebase not configured')
    }
  })

  it('returns offline+queued when navigator.onLine is false', async () => {
    mockHasConfig.mockReturnValue(true)
    const result = await voteForTag({ sessionId: 's1', tagId: 'implement', userId: 'u1' })
    expect(result.ok).toBe(false)
    expect(result.status).toBe('offline')
    if (result.status === 'offline') {
      expect(result.queued).toBe(true)
    }
  })

  it('returns duplicate when localStorage marker set', async () => {
    mockHasConfig.mockReturnValue(true)
    lsStore['pulse_voted_s1_implement_u1'] = '1'
    const result = await voteForTag({ sessionId: 's1', tagId: 'implement', userId: 'u1' })
    expect(result.status).toBe('duplicate')
  })

  it('returns rate_limited after rapid votes', async () => {
    mockHasConfig.mockReturnValue(true)
    const uid = `rl-test-${Math.random()}`
    const { recordVote } = await import('../../lib/pulse/reliability/rateLimiter')
    recordVote(uid)
    const result = await voteForTag({ sessionId: 's2', tagId: 'discovery', userId: uid })
    expect(result.status).toBe('rate_limited')
  })

  it('submits vote via /api/pulse/vote when online', async () => {
    mockHasConfig.mockReturnValue(true)
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, writable: true })
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, status: 'voted' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await voteForTag({ sessionId: 's-live', tagId: 'partner', userId: 'u-live' })
    expect(result.ok).toBe(true)
    expect(result.status).toBe('voted')
    expect(fetchMock).toHaveBeenCalled()
    const call = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(call[0]).toBe('/api/pulse/vote')
    const headers = call[1]?.headers as Record<string, string>
    expect(headers.Authorization).toMatch(/^Bearer /)
  })
})

describe('voteForTag — input validation', () => {
  it('rejects vote with empty sessionId', async () => {
    mockHasConfig.mockReturnValue(true)
    const result = await voteForTag({ sessionId: '', tagId: 'implement', userId: 'u1' })
    expect(result.ok).toBe(false)
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.message).toContain('sessionId')
  })

  it('rejects vote with empty tagId', async () => {
    mockHasConfig.mockReturnValue(true)
    const result = await voteForTag({ sessionId: 's1', tagId: '', userId: 'u1' })
    expect(result.ok).toBe(false)
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.message).toContain('tagId')
  })

  it('rejects vote with empty userId', async () => {
    mockHasConfig.mockReturnValue(true)
    const result = await voteForTag({ sessionId: 's1', tagId: 'implement', userId: '' })
    expect(result.ok).toBe(false)
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.message).toContain('userId')
  })
})

describe('offline queue — idempotency key', () => {
  it('does not enqueue same eventId twice', async () => {
    const { enqueueVote, getQueue, clearQueue, makeEventId } = await import(
      '../../lib/pulse/reliability/offlineQueue'
    )
    clearQueue()
    const vote = { sessionId: 's-idem', tagId: 't-idem', userId: 'u-idem' }
    const eventId = makeEventId(vote.userId, vote.sessionId, vote.tagId)
    enqueueVote({ ...vote, eventId })
    enqueueVote({ ...vote, eventId })
    const q = getQueue()
    expect(q.filter((e) => e.eventId === eventId).length).toBe(1)
    clearQueue()
  })
})
