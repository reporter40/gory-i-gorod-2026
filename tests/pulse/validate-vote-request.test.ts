import { describe, it, expect } from 'vitest'
import { parseVoteRequestBody, isCanonicalTagId } from '../../lib/pulse/server/validate-vote-request'

describe('parseVoteRequestBody', () => {
  it('accepts canonical tag', () => {
    const r = parseVoteRequestBody({ sessionId: 'session-1', tagId: 'implement' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.sessionId).toBe('session-1')
      expect(r.tagId).toBe('implement')
    }
  })

  it('rejects non-canonical tag', () => {
    const r = parseVoteRequestBody({ sessionId: 'session-1', tagId: 'evil' })
    expect(r.ok).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(parseVoteRequestBody({}).ok).toBe(false)
    expect(parseVoteRequestBody({ sessionId: 'x' }).ok).toBe(false)
  })
})

describe('isCanonicalTagId', () => {
  it('covers sprint tag set', () => {
    expect(isCanonicalTagId('implement')).toBe(true)
    expect(isCanonicalTagId('discovery')).toBe(true)
    expect(isCanonicalTagId('partner')).toBe(true)
    expect(isCanonicalTagId('question')).toBe(true)
    expect(isCanonicalTagId('applicable')).toBe(true)
    expect(isCanonicalTagId('other')).toBe(false)
  })
})
