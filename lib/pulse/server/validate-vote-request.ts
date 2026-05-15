import { CANONICAL_REACTION_TAG_IDS } from '../pulse-aggregations'

export type VoteBodyParsed =
  | { ok: true; sessionId: string; tagId: string }
  | { ok: false; error: string }

export function isCanonicalTagId(tagId: string): boolean {
  return (CANONICAL_REACTION_TAG_IDS as readonly string[]).includes(tagId)
}

/** Strict parse for POST /api/pulse/vote JSON body */
export function parseVoteRequestBody(body: unknown): VoteBodyParsed {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'invalid body' }
  }
  const o = body as Record<string, unknown>
  const sessionId = typeof o.sessionId === 'string' ? o.sessionId.trim() : ''
  const tagId = typeof o.tagId === 'string' ? o.tagId.trim() : ''
  if (!sessionId) return { ok: false, error: 'sessionId required' }
  if (!tagId) return { ok: false, error: 'tagId required' }
  if (!isCanonicalTagId(tagId)) return { ok: false, error: 'invalid tagId' }
  return { ok: true, sessionId, tagId }
}
