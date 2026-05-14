import { describe, it, expect, beforeEach } from 'vitest'
import { enqueueVote, getQueue, removeFromQueue, clearQueue, queueSize } from '../../lib/pulse/reliability/offlineQueue'

// Use mock localStorage since tests run in Node
const store: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
  },
  writable: true,
})

beforeEach(() => {
  clearQueue()
})

describe('offlineQueue', () => {
  it('enqueues a vote', () => {
    enqueueVote({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    expect(queueSize()).toBe(1)
  })

  it('enqueues multiple votes', () => {
    enqueueVote({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    enqueueVote({ sessionId: 's1', tagId: 't2', userId: 'u1' })
    expect(queueSize()).toBe(2)
  })

  it('caps queue at 20', () => {
    for (let i = 0; i < 25; i++) {
      enqueueVote({ sessionId: 's1', tagId: `t${i}`, userId: 'u1' })
    }
    expect(queueSize()).toBe(20)
  })

  it('drops oldest when full', () => {
    for (let i = 0; i < 21; i++) {
      enqueueVote({ sessionId: 's1', tagId: `t${i}`, userId: 'u1' })
    }
    const q = getQueue()
    expect(q[0].tagId).toBe('t1') // t0 was dropped
  })

  it('removes specific vote from queue', () => {
    enqueueVote({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    enqueueVote({ sessionId: 's1', tagId: 't2', userId: 'u1' })
    removeFromQueue({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    expect(queueSize()).toBe(1)
    expect(getQueue()[0].tagId).toBe('t2')
  })

  it('clears entire queue', () => {
    enqueueVote({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    clearQueue()
    expect(queueSize()).toBe(0)
  })

  it('stores queuedAt timestamp', () => {
    const before = Date.now()
    enqueueVote({ sessionId: 's1', tagId: 't1', userId: 'u1' })
    const q = getQueue()
    expect(q[0].queuedAt).toBeGreaterThanOrEqual(before)
  })
})
