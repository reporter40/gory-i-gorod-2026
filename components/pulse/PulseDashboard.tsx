'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PulseStage from '@/components/pulse/PulseStage'
import VisualOverlay from '@/components/pulse/VisualOverlay'
import PulseHeader from '@/components/pulse/PulseHeader'
import ProgramNowPanel from '@/components/pulse/ProgramNowPanel'
import LiveHallPulsePanel from '@/components/pulse/LiveHallPulsePanel'
import GeoActivityPanel from '@/components/pulse/GeoActivityPanel'
import HeroPulsePanel from '@/components/pulse/HeroPulsePanel'
import TopTagsPanel from '@/components/pulse/TopTagsPanel'
import TagVotingMoodPanel from '@/components/pulse/TagVotingMoodPanel'
import SessionInterestHeatmap from '@/components/pulse/SessionInterestHeatmap'
import TopicMoodNetwork from '@/components/pulse/TopicMoodNetwork'
import AIInsightsPanel from '@/components/pulse/AIInsightsPanel'
import PulseFooterTicker from '@/components/pulse/PulseFooterTicker'
import SpeakerVotesPanel from '@/components/pulse/SpeakerVotesPanel'
import { defaultPulseMock, buildHeatmapFromTagStats } from '@/lib/pulse/pulse-aggregations'
import { MOCK_SPEAKERS } from '@/lib/pulse/pulse-data'
import { usePulseRealtime } from '@/lib/pulse/usePulseRealtime'
import { PulseErrorBoundary } from '@/lib/pulse/reliability/errorBoundary'
import { startTabKeepAlive } from '@/lib/pulse/reliability/tabKeepAlive'
import { startHeartbeat } from '@/lib/pulse/reliability/heartbeat'
import { startSnapshotSaver } from '@/lib/pulse/reliability/stateSnapshot'

/** Stable mock fixture — avoid new object identity every render */
const STATIC_MOCK_DASHBOARD = defaultPulseMock()

/** Avoid Date.now() during render (react-hooks/purity). */
function StaleIndicatorMinutes({ staleSince }: { staleSince: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return <>{Math.max(0, Math.round((now - staleSince) / 60_000))}</>
}

function PulseDashboardInner() {
  const params = useSearchParams()
  const visualTest = params.get('visualTest') === '1'
  const bgDebug = visualTest && params.get('bgDebug') === '1'
  const refOverlay =
    visualTest &&
    params.get('overlay') === '1' &&
    !bgDebug &&
    process.env.NODE_ENV !== 'production'

  // Live engine: usePulseRealtime returns mock when ?visualTest=1 or no Firebase config
  const liveState = usePulseRealtime()

  const sessionHeatmap = useMemo(() => {
    if (liveState._meta.heatmapSource === 'mock') return STATIC_MOCK_DASHBOARD.sessionHeatmap
    return buildHeatmapFromTagStats({
      sessionId: liveState.event.activeSessionId ?? '',
      tagStats: liveState.topTags.map((t) => ({
        tagId: t.id,
        label: t.name,
        count: t.votes,
      })),
    })
  }, [liveState._meta.heatmapSource, liveState.event.activeSessionId, liveState.topTags])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const activeSessionId = liveState.event.activeSessionId ?? ''
    const votesPath = activeSessionId ? `votes/${activeSessionId}` : ''
    const tagStats = liveState.topTags.map((t) => ({
      tagId: t.id,
      label: t.name,
      count: t.votes,
    }))
    console.group('[PulseHeatmap]')
    console.log({
      activeSessionId,
      votesPath,
      tagStats,
      heatmap: sessionHeatmap,
      heatmapSource: liveState._meta.heatmapSource,
      source: liveState._meta.source,
    })
    console.groupEnd()
  }, [
    liveState._meta.source,
    liveState._meta.heatmapSource,
    liveState.event.activeSessionId,
    liveState.topTags,
    sessionHeatmap,
  ])

  // Merge live fields into mock shell (layout chrome). Heatmap row uses votes when not mock.
  const sortedTags = [...liveState.topTags].sort((a, b) => b.votes - a.votes)
  const voting = {
    leftDonut: {
      label: sortedTags[0]?.name ?? STATIC_MOCK_DASHBOARD.voting.leftDonut.label,
      percent: sortedTags[0]?.mood ?? STATIC_MOCK_DASHBOARD.voting.leftDonut.percent,
      votes: sortedTags[0]?.votes ?? STATIC_MOCK_DASHBOARD.voting.leftDonut.votes,
      trend: sortedTags[0]?.growth ?? STATIC_MOCK_DASHBOARD.voting.leftDonut.trend,
    },
    rightDonut: {
      label: sortedTags[1]?.name ?? STATIC_MOCK_DASHBOARD.voting.rightDonut.label,
      percent: sortedTags[1]?.mood ?? STATIC_MOCK_DASHBOARD.voting.rightDonut.percent,
      votes: sortedTags[1]?.votes ?? STATIC_MOCK_DASHBOARD.voting.rightDonut.votes,
      trend: sortedTags[1]?.growth ?? STATIC_MOCK_DASHBOARD.voting.rightDonut.trend,
    },
    avatarGroups: STATIC_MOCK_DASHBOARD.voting.avatarGroups,
  }

  const state = {
    ...STATIC_MOCK_DASHBOARD,
    stats: liveState.stats,
    sessions: liveState.sessions,
    topTags: liveState.topTags,
    tagMoodBars: liveState.tagMoodBars,
    topicNetwork: liveState.topicNetwork,
    geoRegions: liveState.geoRegions,
    hallPulse: liveState.hallPulse,
    aiInsights: liveState.aiInsights,
    footer: liveState.footer,
    voting,
    sessionHeatmap,
  }

  const avatarsForVote = Object.values(MOCK_SPEAKERS).map(s => ({
    id: s.id,
    initials: s.initials,
    color: s.color,
  }))
  const heatSpeakers = [MOCK_SPEAKERS.a, MOCK_SPEAKERS.b, MOCK_SPEAKERS.e].map(s => ({
    initials: s.initials,
    color: s.color,
  }))

  // Reliability: tab keep-alive + heartbeat + snapshot saver
  useEffect(() => {
    const stopKeepAlive = startTabKeepAlive()
    const stopHeartbeat = startHeartbeat('main')
    const stopSnapshot = startSnapshotSaver(() => liveState)
    return () => { stopKeepAlive(); stopHeartbeat(); stopSnapshot() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFrozen = liveState.event.frozen
  const isStale = liveState._meta.staleSince !== null
  const isOffline = liveState.connection.status === 'offline'
  const isReconnecting = liveState.connection.status === 'reconnecting'

  return (
    <div className="pulse-shell">
      {/* Connection dot — top right, only when disconnected, hidden in visualTest */}
      {!visualTest && (isOffline || isReconnecting) && (
        <div style={{
          position: 'fixed', top: 12, right: 12, zIndex: 9999,
          width: 10, height: 10, borderRadius: '50%',
          background: isReconnecting ? '#fbbf24' : '#ef4444',
          boxShadow: `0 0 8px ${isReconnecting ? '#fbbf2488' : '#ef444488'}`,
        }} />
      )}

      {/* Stale indicator — bottom right, hidden in visualTest */}
      {!visualTest && isStale && !isFrozen && liveState._meta.staleSince != null && (
        <div style={{
          position: 'fixed', bottom: 0, right: 20, zIndex: 9998,
          background: 'rgba(0,0,0,0.75)', color: '#fbbf24',
          padding: '6px 14px', borderRadius: '8px 8px 0 0',
          fontSize: '12px',
        }}>
          Обновлено <StaleIndicatorMinutes staleSince={liveState._meta.staleSince} /> мин назад
        </div>
      )}

      {/* Freeze banner — bottom, amber, silent for audience, hidden in visualTest */}
      {!visualTest && isFrozen && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: 'rgba(245,158,11,0.92)', color: '#000',
          textAlign: 'center', padding: '8px',
          fontSize: '13px', fontWeight: 600,
        }}>
          Данные зафиксированы
        </div>
      )}

      <div className="pulse-page-outer">
        <PulseStage visualTest={visualTest} bgDebug={bgDebug}>
          <PulseHeader />
          <PulseErrorBoundary panelName="ProgramNow">
            <ProgramNowPanel sessions={state.sessions} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="LiveHallPulse">
            <LiveHallPulsePanel current={state.hallPulse.current} timeline={state.hallPulse.timeline} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="GeoActivity">
            <GeoActivityPanel regions={state.geoRegions} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="HeroPulse">
            <HeroPulsePanel state={state} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="TopTags">
            <TopTagsPanel topTags={state.topTags} filterTabs={state.tagFilterTabs} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="TagVotingMood">
            <TagVotingMoodPanel
              left={{ label: voting.leftDonut.label, percent: voting.leftDonut.percent, votes: voting.leftDonut.votes, trend: voting.leftDonut.trend }}
              right={{
                label: voting.rightDonut.label,
                percent: voting.rightDonut.percent,
                votes: voting.rightDonut.votes,
                trend: voting.rightDonut.trend,
              }}
              bars={state.tagMoodBars}
              avatarSlices={avatarsForVote}
            />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="SessionHeatmap">
            <SessionInterestHeatmap heat={state.sessionHeatmap} speakerDots={heatSpeakers} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="TopicNetwork">
            <TopicMoodNetwork nodes={state.topicNetwork} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="SpeakerVotes">
            <SpeakerVotesPanel />
          </PulseErrorBoundary>
          <VisualOverlay enabled={refOverlay} />
        </PulseStage>
      </div>
    </div>
  )
}

export default function PulseDashboard() {
  return (
    <Suspense fallback={<div className="pulse-shell min-h-screen bg-[var(--pulse-bg-primary)]" />}>
      <PulseDashboardInner />
    </Suspense>
  )
}
