import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase modules — vote-client lazy-imports them
vi.mock('@/lib/pulse/firebase/client', () => ({
  hasFirebaseConfig: () => false,
  getFirebaseDb: () => ({}),
}))

// Mock localStorage
const lsStore: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => lsStore[k] ?? null,
    setItem: (k: string, v: string) => { lsStore[k] = v },
    removeItem: (k: string) => { delete lsStore[k] },
  },
  writable: true,
})

// Mock navigator.onLine
Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: false },
  writable: true,
})

import { voteForTag } from '../../lib/pulse/vote-client'
import { clearQueue } from '../../lib/pulse/reliability/offlineQueue'

beforeEach(() => {
  clearQueue()
  // Clear all vote markers from localStorage
  Object.keys(lsStore).forEach((k) => { delete lsStore[k] })
})

describe('voteForTag', () => {
  it('returns offline+queued when navigator.onLine is false', async () => {
    const result = await voteForTag({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    expect(result.ok).toBe(false)
    expect(result.status).toBe('offline')
    if (result.status === 'offline') {
      expect(result.queued).toBe(true)
    }
  })

  it('returns duplicate when localStorage marker set', async () => {
    lsStore['pulse_voted_s1_t1_u1'] = '1'
    const result = await voteForTag({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    expect(result.status).toBe('duplicate')
  })

  it('returns rate_limited after rapid votes', async () => {
    // First vote goes offline (no Firebase), second within 2s should rate-limit
    // Since navigator.onLine=false, first vote queues without recording rate limit
    // Let's test rate limiter directly via consecutive calls from same user
    const uid = `rl-test-${Math.random()}`
    // Record a vote to trigger cooldown
    const { recordVote } = await import('../../lib/pulse/reliability/rateLimiter')
    recordVote(uid)
    const result = await voteForTag({ sessionId: 's2', tagId: 't2', userId: uid })
    expect(result.status).toBe('rate_limited')
  })
})
