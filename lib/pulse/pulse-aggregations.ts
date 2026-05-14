import type { MockPulseState, PulseTopTag } from './pulse-data'
import { mockPulseState } from './pulse-data'
import type { PulseState, PulseTagStat, PulseTopicNode, PulseHeatmapCell, PulseInsight } from './types'

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

// --- Live-engine aggregations ---

export function getTagTotals(tags: PulseTagStat[]): Record<string, number> {
  return Object.fromEntries(tags.map((t) => [t.id, t.votes]))
}

export function getEngagementPercent(state: PulseState): number {
  const { expectedAudience } = state.event
  const { onlineParticipants } = state.stats
  if (expectedAudience <= 0) return 0
  return Math.min(100, Math.round((onlineParticipants / expectedAudience) * 100))
}

export function getTopicMood(nodes: PulseTopicNode[]): Array<{ id: string; mood: 'hot' | 'rising' | 'stable' }> {
  return nodes.map((n) => ({
    id: n.id,
    mood: n.trend >= 10 ? 'hot' : n.trend >= 5 ? 'rising' : 'stable',
  }))
}

export function getHeatmapMatrix(cells: PulseHeatmapCell[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {}
  for (const c of cells) {
    if (!out[c.hall]) out[c.hall] = {}
    out[c.hall][c.time] = c.value
  }
  return out
}

export function getSpeakerResonance(state: PulseState): Array<{ speakerId: string; score: number }> {
  return state.sessions
    .filter((s) => s.status === 'live' || s.status === 'ended')
    .map((s) => {
      const tagVotes = state.topTags.reduce((sum, t) => sum + t.votes, 0)
      const score = Math.min(100, Math.round((tagVotes / Math.max(1, state.event.expectedAudience)) * 100))
      return { speakerId: s.speakerId, score }
    })
}

export function getAiInsights(insights: PulseInsight[]): string[] {
  return insights.map((i) => `${i.icon} ${i.text}`)
}

export function buildPulseStateFromRaw(raw: Partial<PulseState>, base: PulseState): PulseState {
  return { ...base, ...raw }
}
