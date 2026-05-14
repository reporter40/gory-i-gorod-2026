import { describe, it, expect } from 'vitest'
import rules from '../../lib/pulse/firebase/rules.json'

/** JSON rule contract — emulator scenarios documented in docs/PULSE_RTD_ACCESS_MODEL.md */

describe('Firebase Rules — SPRINT-PULSE-04 contract', () => {
  it('votes: client writes disabled (server Admin only)', () => {
    const tag = (
      (rules.rules.votes as Record<string, unknown>).$sessionId as Record<string, unknown>
    ).$tagId as { '.write': boolean }
    expect(tag['.write']).toBe(false)
    expect(tag['.validate']).toContain('isNumber()')
  })

  it('userVotes: client writes disabled', () => {
    const tag = (
      ((rules.rules.userVotes as Record<string, unknown>).$sessionId as Record<string, unknown>).$userId as Record<
        string,
        unknown
      >
    ).$tagId as { '.write': boolean; '.read': string }
    expect(tag['.write']).toBe(false)
    expect(tag['.read']).toContain('auth.uid === $userId')
  })

  it('mood: client writes disabled', () => {
    const pushRule = (rules.rules.mood as Record<string, unknown>).$pushId as { '.write': boolean }
    expect(pushRule['.write']).toBe(false)
  })

  it('sessions: read public, no client write', () => {
    const s = rules.rules.sessions as Record<string, unknown>
    expect(s['.read']).toBe(true)
    expect(s['.write']).toBe(false)
  })

  it('speakers: read public, no client write', () => {
    const s = rules.rules.speakers as Record<string, unknown>
    expect(s['.read']).toBe(true)
    expect(s['.write']).toBe(false)
  })

  it('event: read public, no client write', () => {
    const e = rules.rules.event as Record<string, unknown>
    expect(e['.read']).toBe(true)
    expect(e['.write']).toBe(false)
  })

  it('participants: write only own uid', () => {
    const uidRule = (rules.rules.participants as Record<string, unknown>).$uid as {
      '.write': string
      '.validate': string
    }
    expect(uidRule['.write']).toContain('auth.uid === $uid')
    expect(uidRule['.validate']).toContain('consent')
  })

  it('heartbeat lastSeen requires auth to write', () => {
    const dashRule = rules.rules.heartbeat.$dashboardId as { lastSeen: { '.write': string } }
    expect(dashRule.lastSeen['.write']).toContain('auth != null')
  })
})
