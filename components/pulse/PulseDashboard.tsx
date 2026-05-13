'use client'

import { Suspense } from 'react'
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

function PulseDashboardInner() {
  const params = useSearchParams()
  const visualTest = params.get('visualTest') === '1'
  const refOverlay =
    visualTest && params.get('overlay') === '1' && process.env.NODE_ENV !== 'production'

  const state = defaultPulseMock()
  const avatarsForVote = Object.values(MOCK_SPEAKERS).map(s => ({
    id: s.id,
    initials: s.initials,
    color: s.color,
  }))
  const heatSpeakers = [MOCK_SPEAKERS.a, MOCK_SPEAKERS.b, MOCK_SPEAKERS.e].map(s => ({
    initials: s.initials,
    color: s.color,
  }))
  const { voting } = state

  return (
    <div className="pulse-shell">
      <div className="pulse-page-outer">
        <PulseStage visualTest={visualTest}>
          <PulseHeader />
          <ProgramNowPanel sessions={state.sessions} />
          <LiveHallPulsePanel current={state.hallPulse.current} timeline={state.hallPulse.timeline} />
          <GeoActivityPanel regions={state.geoRegions} />
          <HeroPulsePanel state={state} />
          <TopTagsPanel topTags={state.topTags} filterTabs={state.tagFilterTabs} />
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
          <SessionInterestHeatmap heat={state.sessionHeatmap} speakerDots={heatSpeakers} />
          <TopicMoodNetwork nodes={state.topicNetwork} />
          <AIInsightsPanel insights={state.aiInsights} />
          <PulseFooterTicker footer={state.footer} />
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
