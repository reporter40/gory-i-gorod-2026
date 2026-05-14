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
import { useEventMode } from '@/lib/pulse/useEventMode'
import QRCode from 'react-qr-code'

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

  const eventMode = useEventMode()
  // Always use production URL for QR — localhost is unreachable from phones
  const PROD_URL = 'https://gory-i-gorod-2026.vercel.app'
  const voteUrl = (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'))
    ? `${window.location.origin}/pulse/vote`
    : `${PROD_URL}/pulse/vote`

  // Mobile redirect: phone users visiting /pulse during vote mode → go straight to registration
  useEffect(() => {
    if (eventMode === 'vote' && typeof window !== 'undefined' && window.innerWidth < 768) {
      window.location.replace(voteUrl)
    }
  }, [eventMode, voteUrl])

  const isFrozen = liveState._meta.source === 'frozen'
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
      {!visualTest && isStale && !isFrozen && (
        <div style={{
          position: 'fixed', bottom: 0, right: 20, zIndex: 9998,
          background: 'rgba(0,0,0,0.75)', color: '#fbbf24',
          padding: '6px 14px', borderRadius: '8px 8px 0 0',
          fontSize: '12px',
        }}>
          Обновлено {Math.round((Date.now() - (liveState._meta.staleSince ?? Date.now())) / 60000)} мин назад
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

      {/* VOTE mode: full-screen QR overlay — operator triggers via Telegram /vote */}
      {eventMode === 'vote' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'linear-gradient(135deg, #050a18 0%, #0a0f2e 50%, #050a18 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '32px',
        }}>
          <div style={{ color: '#00e5ff', fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>
            Сканируй и голосуй
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 0 60px #00e5ff44' }}>
            <QRCode value={voteUrl} size={280} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <div style={{ color: '#94a3b8', fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)', textAlign: 'center', maxWidth: '500px' }}>
            {voteUrl}
          </div>
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
