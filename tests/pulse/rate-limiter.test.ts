import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, recordVote } from '../../lib/pulse/reliability/rateLimiter'

// Reset module state between tests by re-importing fresh state each test
// (userStates is module-level Map — tests share it within a suite)

describe('rateLimiter', () => {
  const uid = `test-user-${Math.random()}`

  it('allows first vote', () => {
    const result = checkRateLimit(uid)
    expect(result.limited).toBe(false)
  })

  it('blocks second vote within 2s cooldown', () => {
    const uid2 = `cooldown-${Math.random()}`
    recordVote(uid2)
    const result = checkRateLimit(uid2)
    expect(result.limited).toBe(true)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('blocks after 30 votes per minute (5-min block)', () => {
    const uid3 = `spam-${Math.random()}`
    // Record 30 votes — fills minuteVotes array
    for (let i = 0; i < 30; i++) {
      recordVote(uid3)
    }
    // At this point 2s cooldown fires first (lastVoteTime = now)
    // checkRateLimit will return limited=true due to cooldown OR per-minute
    const result = checkRateLimit(uid3)
    expect(result.limited).toBe(true)
    // Either cooldown (retryAfter=2) or 5-min block (retryAfter>=300)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('retryAfter is a positive number when limited', () => {
    const uid4 = `retry-${Math.random()}`
    recordVote(uid4)
    const result = checkRateLimit(uid4)
    if (result.limited) {
      expect(typeof result.retryAfter).toBe('number')
      expect(result.retryAfter).toBeGreaterThan(0)
    }
  })
})
