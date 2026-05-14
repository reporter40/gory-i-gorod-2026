import { describe, it, expect } from 'vitest'
import rules from '../../lib/pulse/firebase/rules.json'

// Logic tests for Firebase Security Rules structure.
// Full emulator tests require @firebase/rules-unit-testing + running emulator.
// These tests verify rule shape and critical constraints from the JSON.

describe('Firebase Rules — structure', () => {
  it('has votes rules', () => {
    expect(rules.rules.votes).toBeDefined()
  })

  it('votes validate number 0–100000', () => {
    const validate = (rules.rules.votes as Record<string, unknown>).$sessionId as Record<string, unknown>
    const tagRule = validate.$tagId as { '.validate': string }
    expect(tagRule['.validate']).toContain('isNumber()')
    expect(tagRule['.validate']).toContain('100000')
  })

  it('userVotes write only if !data.exists()', () => {
    const r = rules.rules.userVotes
    const tagRule = (r as Record<string, unknown>).$sessionId as Record<string, unknown>
    const userRule = tagRule.$userId as Record<string, unknown>
    const write = (userRule.$tagId as { '.write': string })['.write']
    expect(write).toContain('!data.exists()')
    expect(write).toContain('auth.uid === $userId')
  })

  it('userVotes validate boolean true only', () => {
    const r = rules.rules.userVotes
    const tagRule = (r as Record<string, unknown>).$sessionId as Record<string, unknown>
    const userRule = tagRule.$userId as Record<string, unknown>
    const validate = (userRule.$tagId as { '.validate': string })['.validate']
    expect(validate).toContain('isBoolean()')
    expect(validate).toContain('true')
  })

  it('mood requires 4 fields', () => {
    const pushRule = (rules.rules.mood as Record<string, unknown>).$pushId as { '.validate': string }
    expect(pushRule['.validate']).toContain('tagId')
    expect(pushRule['.validate']).toContain('sessionId')
    expect(pushRule['.validate']).toContain('userId')
    expect(pushRule['.validate']).toContain('ts')
  })

  it('event is publicly readable', () => {
    const eventRead = (rules.rules.event as Record<string, unknown>)['.read']
    expect(eventRead).toBe(true)
  })

  it('frozen is readable without auth', () => {
    const frozenRead = (rules.rules.event as Record<string, unknown>).frozen as { '.read': boolean }
    expect(frozenRead['.read']).toBe(true)
  })

  it('sessions are publicly readable', () => {
    const sessRead = (rules.rules.sessions as Record<string, unknown>)['.read']
    expect(sessRead).toBe(true)
  })

  it('heartbeat requires auth to write', () => {
    const dashRule = rules.rules.heartbeat.$dashboardId as { lastSeen: { '.write': string } }
    expect(dashRule.lastSeen['.write']).toContain('auth != null')
  })
})
