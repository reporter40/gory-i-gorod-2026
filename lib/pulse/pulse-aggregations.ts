import type { MockPulseState, PulseTopTag } from './pulse-data'
import { mockPulseState } from './pulse-data'

export function pulseTopTagsByVotes(tags: PulseTopTag[]): PulseTopTag[] {
  return [...tags].sort((a, b) => b.votes - a.votes)
}

export function pulseEngagementLabel(activity: number): string {
  if (activity >= 70) return 'Высокая'
  if (activity >= 45) return 'Средняя'
  return 'Низкая'
}

export function pulseExpectedFillRatio(state: MockPulseState): number {
  const { expectedAudience } = state.event
  const { onlineParticipants } = state.stats
  if (expectedAudience <= 0) return 0
  return Math.min(100, Math.round((onlineParticipants / expectedAudience) * 100))
}

export function defaultPulseMock(): MockPulseState {
  return mockPulseState
}
