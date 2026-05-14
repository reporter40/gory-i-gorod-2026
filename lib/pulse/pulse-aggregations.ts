import type { MockPulseState, PulseTopTag, SessionHeatmap } from './pulse-data'
import { mockPulseState } from './pulse-data'
import type {
  PulseState,
  PulseTagStat,
  PulseTopicNode,
  PulseHeatmapCell,
  PulseInsight,
  PulsePrimarySource,
  PulseHeatmapLineage,
  PulseStateMeta,
} from './types'

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

export function buildPulseStateMeta(input: {
  mode: PulsePrimarySource
  activeSessionId: string | null
  topTags: PulseTagStat[]
  /** Fixed clock for mock adapter / visual tests */
  lastUpdated?: number
}): PulseStateMeta {
  const eventsCount = input.topTags.reduce((s, t) => s + t.votes, 0)
  const heatmapSource: PulseHeatmapLineage =
    input.mode === 'mock' ? 'mock' : eventsCount > 0 ? 'votes' : 'empty'

  return {
    source: input.mode,
    activeSessionId: input.activeSessionId,
    eventsCount,
    heatmapSource,
    lastUpdated: input.lastUpdated ?? Date.now(),
    staleSince: null,
    errors: [],
  }
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

// ─── Pure aggregation for testability ────────────────────────────────────────
// Represents a single raw reaction event (canonical contract).
export interface PulseReactionEvent {
  id: string
  participantId: string
  sessionId: string
  tagId: string
  tagLabel: string
  createdAt: number
  source: 'mobile'
}

export interface AggregatedReactions {
  // tagId → count for this session
  byTag: Record<string, number>
  // sessionId → tagId → count
  bySession: Record<string, Record<string, number>>
  totalVotes: number
}

/**
 * Pure aggregation over a list of PulseReactionEvents.
 * Used for unit tests and future batch processing.
 * Rejects events with missing participantId / sessionId / tagId.
 */
export function aggregatePulseEvents(events: PulseReactionEvent[]): AggregatedReactions {
  const byTag: Record<string, number> = {}
  const bySession: Record<string, Record<string, number>> = {}
  let totalVotes = 0

  for (const e of events) {
    if (!e.participantId || !e.sessionId || !e.tagId) continue

    byTag[e.tagId] = (byTag[e.tagId] ?? 0) + 1

    if (!bySession[e.sessionId]) bySession[e.sessionId] = {}
    bySession[e.sessionId][e.tagId] = (bySession[e.sessionId][e.tagId] ?? 0) + 1

    totalVotes++
  }

  return { byTag, bySession, totalVotes }
}

/** Same grid shape as SessionInterestHeatmap expects — derived only from vote counters */
export type HeatmapData = SessionHeatmap

/** Must stay aligned with app/pulse/vote/page.tsx DEFAULT_TAGS and firebasePulseAdapter TAG_META */
export const CANONICAL_REACTION_TAG_IDS = [
  'implement',
  'discovery',
  'partner',
  'question',
  'applicable',
] as const

export type CanonicalReactionTagId = (typeof CANONICAL_REACTION_TAG_IDS)[number]

/** Display labels for participant / results UIs — keep aligned with vote page tags */
export const CANONICAL_REACTION_TAG_LABELS: Record<CanonicalReactionTagId, string> = {
  implement: 'Хочу внедрить',
  discovery: 'Открытие',
  partner: 'Ищу партнёров',
  question: 'Есть вопрос',
  applicable: 'Применимо у нас',
}

function isCanonicalTagId(id: string): id is CanonicalReactionTagId {
  return (CANONICAL_REACTION_TAG_IDS as readonly string[]).includes(id)
}

/**
 * Builds SessionHeatmap rows from live vote counts only (canonical reaction tags).
 * intensity ∈ [0,1] internally → values are 0–100 for SessionInterestHeatmap color scale.
 * Zero totals → empty grid (no mock filler cells).
 */
export function buildHeatmapFromTagStats(input: {
  sessionId: string
  tagStats: Array<{ tagId: string; label: string; count: number }>
}): HeatmapData {
  void input.sessionId

  const filtered = input.tagStats.filter((t) => isCanonicalTagId(t.tagId))
  if (filtered.length === 0) {
    return {
      halls: [],
      times: [],
      values: [],
      highlight: { hallIndex: 0, timeIndex: 0, engagement: 0, label: '' },
    }
  }

  const ordered = CANONICAL_REACTION_TAG_IDS.map((id) => {
    const row = filtered.find((t) => t.tagId === id)
    return {
      tagId: id,
      label: row?.label?.trim() ? row.label : CANONICAL_REACTION_TAG_LABELS[id],
      count: Math.max(0, row?.count ?? 0),
    }
  })

  const total = ordered.reduce((s, r) => s + r.count, 0)
  if (total === 0) {
    return {
      halls: [],
      times: [],
      values: [],
      highlight: { hallIndex: 0, timeIndex: 0, engagement: 0, label: '' },
    }
  }

  const maxCount = Math.max(...ordered.map((r) => r.count), 0)
  const intensities01 = ordered.map((r) => (maxCount > 0 ? r.count / maxCount : 0))
  const values = intensities01.map((t) => [Math.round(t * 100)] as const)

  let maxIdx = 0
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].count > ordered[maxIdx].count) maxIdx = i
  }

  return {
    halls: ordered.map((r) => r.label),
    times: ['Реакции'],
    values,
    highlight: {
      hallIndex: maxIdx,
      timeIndex: 0,
      engagement: values[maxIdx]?.[0] ?? 0,
      label: ordered[maxIdx]?.label ?? '',
    },
  }
}

/** PulseState.heatmap flat cells — same numbers as SessionHeatmap grid */
export function sessionHeatmapToCells(h: HeatmapData): PulseHeatmapCell[] {
  if (!h.halls.length || !h.times.length) return []
  return h.halls.flatMap((hall, hi) =>
    h.times.map((time, ti) => ({
      hall,
      time,
      value: h.values[hi]?.[ti] ?? 0,
    })),
  )
}
