// Live-engine data contract — shared between Firebase adapter and mock adapter.
// Visual components consume MockPulseState from pulse-data.ts until integration step.

export interface PulseEvent {
  name: string
  activeSessionId: string
  expectedAudience: number
  frozen: boolean
  updatedAt: number
}

export interface PulseStats {
  onlineParticipants: number
  participantsChange: number
  hallActivity: number
  engagement: number
  engagementChange: number
  speakersToday: number
  overallEngagement: number
}

export interface PulseSpeakerRef {
  id: string
  name: string
  initials: string
  color: string
}

export interface PulseSession {
  id: string
  time: string
  type: string
  title: string
  hall: string
  speakerId: string
  start: number
  end: number
  status: 'upcoming' | 'live' | 'ended'
  isLive?: boolean
  speakers: PulseSpeakerRef[]
}

export interface PulseTagStat {
  id: string
  name: string
  icon: string
  votes: number
  growth: number
  mood: number
}

export interface PulseTagMood {
  name: string
  value: number
  color?: string
}

export interface PulseTopicNode {
  id: string
  name: string
  value: number
  trend: number
}

export interface PulseGeoRegion {
  name: string
  percent: number
}

export interface PulseHallPulse {
  current: number
  timeline: Array<{ time: string; value: number }>
}

export interface PulseHeatmapCell {
  hall: string
  time: string
  value: number
}

export interface PulseInsight {
  icon: string
  text: string
}

export interface PulseFooter {
  quote: string
  quoteAuthor: string
  trends: readonly string[]
  nextRecommendation: string
}

export interface PulseConnectionState {
  status: 'connected' | 'reconnecting' | 'offline' | 'frozen'
  lastConnected: number | null
  reconnectAttempt: number
}

/** Dashboard lineage: mock adapter vs Firebase live path vs no active session signal */
export type PulsePrimarySource = 'live' | 'empty' | 'mock'

/** Heatmap grid is driven by vote counters, mock fixture, or intentionally empty */
export type PulseHeatmapLineage = 'votes' | 'mock' | 'empty'

export interface PulseStateMeta {
  source: PulsePrimarySource
  activeSessionId: string | null
  /** Sum of canonical reaction counts for the active session */
  eventsCount: number
  heatmapSource: PulseHeatmapLineage
  lastUpdated: number
  staleSince: number | null
  errors: string[]
}

export interface PulseState {
  event: PulseEvent
  stats: PulseStats
  sessions: PulseSession[]
  topTags: PulseTagStat[]
  tagMoodBars: PulseTagMood[]
  topicNetwork: PulseTopicNode[]
  geoRegions: PulseGeoRegion[]
  hallPulse: PulseHallPulse
  heatmap: PulseHeatmapCell[]
  aiInsights: PulseInsight[]
  footer: PulseFooter
  connection: PulseConnectionState
  _meta: PulseStateMeta
}

export type PulseAdapter = {
  subscribe(callback: (state: PulseState) => void): () => void
  getConnectionState(): PulseConnectionState
  destroy(): void
}
