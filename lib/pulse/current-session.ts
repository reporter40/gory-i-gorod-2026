import type { PulseSession } from './types'

export function getCurrentSession(
  sessions: PulseSession[],
  activeSessionId: string
): PulseSession | undefined {
  return sessions.find((s) => s.id === activeSessionId)
}

export function getSessionTags(sessionId: string): string[] {
  // Returns tag IDs for a given session.
  // In live mode these come from Firebase votes/{sessionId}.
  // In mock mode returns default tag set.
  void sessionId
  return ['actual', 'ppp', 'innovation', 'cases', 'invest']
}
