'use client'

import { Suspense, useEffect } from 'react'
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
import { defaultPulseMock } from '@/lib/pulse/pulse-aggregations'
import { MOCK_SPEAKERS } from '@/lib/pulse/pulse-data'
import { usePulseRealtime } from '@/lib/pulse/usePulseRealtime'
import { PulseErrorBoundary } from '@/lib/pulse/reliability/errorBoundary'
import { startTabKeepAlive } from '@/lib/pulse/reliability/tabKeepAlive'
import { startHeartbeat } from '@/lib/pulse/reliability/heartbeat'
import { startSnapshotSaver } from '@/lib/pulse/reliability/stateSnapshot'

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
  const mockState = defaultPulseMock()

  // Merge live fields into mock shape.
  // sessionHeatmap, tagFilterTabs, voting.avatarGroups stay from mock —
  // Firebase doesn't push these; they're visual-only or derived.
  const sortedTags = [...liveState.topTags].sort((a, b) => b.votes - a.votes)
  const voting = {
    leftDonut: {
      label: sortedTags[0]?.name ?? mockState.voting.leftDonut.label,
      percent: sortedTags[0]?.mood ?? mockState.voting.leftDonut.percent,
      votes: sortedTags[0]?.votes ?? mockState.voting.leftDonut.votes,
      trend: sortedTags[0]?.growth ?? mockState.voting.leftDonut.trend,
    },
    rightDonut: {
      label: sortedTags[1]?.name ?? mockState.voting.rightDonut.label,
      percent: sortedTags[1]?.mood ?? mockState.voting.rightDonut.percent,
      votes: sortedTags[1]?.votes ?? mockState.voting.rightDonut.votes,
      trend: sortedTags[1]?.growth ?? mockState.voting.rightDonut.trend,
    },
    avatarGroups: mockState.voting.avatarGroups,
  }

  const state = {
    ...mockState,
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
    // sessionHeatmap stays from mockState (visual-only, Firebase sends heatmap cells)
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

  const isFrozen = liveState._meta.source === 'frozen'
  const isStale = liveState._meta.staleSince !== null

  return (
    <div className="pulse-shell">
      {isFrozen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#1e1b4b', borderBottom: '1px solid #4f46e5', padding: '8px', textAlign: 'center', color: '#a5b4fc', fontSize: '0.85rem' }}>
          🔒 Данные зафиксированы
        </div>
      )}
      {isStale && !isFrozen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#1c1917', borderBottom: '1px solid #78716c44', padding: '6px', textAlign: 'center', color: '#78716c', fontSize: '0.75rem' }}>
          Обновлено {Math.floor((Date.now() - (liveState._meta.staleSince ?? Date.now())) / 60000)} мин назад
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
          <PulseErrorBoundary panelName="AIInsights">
            <AIInsightsPanel insights={state.aiInsights} />
          </PulseErrorBoundary>
          <PulseErrorBoundary panelName="Footer">
            <PulseFooterTicker footer={state.footer} />
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
