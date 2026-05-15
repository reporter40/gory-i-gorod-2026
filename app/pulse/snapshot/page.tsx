'use client'

import { useEffect, useState } from 'react'
import PulseStage from '@/components/pulse/PulseStage'
import PulseHeader from '@/components/pulse/PulseHeader'
import ProgramNowPanel from '@/components/pulse/ProgramNowPanel'
import GeoActivityPanel from '@/components/pulse/GeoActivityPanel'
import HeroPulsePanel from '@/components/pulse/HeroPulsePanel'
import TopTagsPanel from '@/components/pulse/TopTagsPanel'
import SpeakerVotesPanel from '@/components/pulse/SpeakerVotesPanel'
import SessionInterestHeatmap from '@/components/pulse/SessionInterestHeatmap'
import TagVotingMoodPanel from '@/components/pulse/TagVotingMoodPanel'
import { defaultPulseMock, buildHeatmapFromTagStats } from '@/lib/pulse/pulse-aggregations'
import { MOCK_SPEAKERS } from '@/lib/pulse/pulse-data'
import type { PulseState } from '@/lib/pulse/types'

const SNAPSHOT_KEY = 'pulse_last_good_state_v3'
const STATIC_MOCK = defaultPulseMock()

function loadSnapshotRaw(): { state: PulseState; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as PulseState
    const savedAt = state._meta?.lastUpdated ?? 0
    return { state, savedAt }
  } catch {
    return null
  }
}

export default function SnapshotPage() {
  const [data, setData] = useState<{ state: PulseState; savedAt: number } | null | 'loading'>('loading')

  useEffect(() => {
    setData(loadSnapshotRaw())
  }, [])

  if (data === 'loading') {
    return (
      <div className="pulse-shell min-h-screen bg-[var(--pulse-bg-primary)] flex items-center justify-center">
        <p className="text-white/50 text-sm">Загрузка снимка...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="pulse-shell min-h-screen bg-[var(--pulse-bg-primary)] flex flex-col items-center justify-center gap-4">
        <p className="text-white/70 text-lg font-semibold">Снимок не найден</p>
        <p className="text-white/40 text-sm">Дашборд должен хотя бы раз открыться в онлайн-режиме,</p>
        <p className="text-white/40 text-sm">чтобы снимок сохранился.</p>
        <a href="/pulse/live" className="mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30">
          Открыть LIVE →
        </a>
      </div>
    )
  }

  const { state: snap, savedAt } = data
  const savedTime = savedAt
    ? new Date(savedAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Europe/Moscow' })
    : '—'
  const ageMin = savedAt ? Math.round((Date.now() - savedAt) / 60_000) : null

  const sortedTags = [...(snap.topTags ?? [])].sort((a, b) => b.votes - a.votes)
  const voting = {
    leftDonut: {
      label: sortedTags[0]?.name ?? STATIC_MOCK.voting.leftDonut.label,
      percent: sortedTags[0]?.mood ?? STATIC_MOCK.voting.leftDonut.percent,
      votes: sortedTags[0]?.votes ?? STATIC_MOCK.voting.leftDonut.votes,
      trend: sortedTags[0]?.growth ?? STATIC_MOCK.voting.leftDonut.trend,
    },
    rightDonut: {
      label: sortedTags[1]?.name ?? STATIC_MOCK.voting.rightDonut.label,
      percent: sortedTags[1]?.mood ?? STATIC_MOCK.voting.rightDonut.percent,
      votes: sortedTags[1]?.votes ?? STATIC_MOCK.voting.rightDonut.votes,
      trend: sortedTags[1]?.growth ?? STATIC_MOCK.voting.rightDonut.trend,
    },
    avatarGroups: STATIC_MOCK.voting.avatarGroups,
  }

  const sessionHeatmap = (() => {
    const built = buildHeatmapFromTagStats({
      sessionId: snap.event?.activeSessionId ?? '',
      tagStats: (snap.topTags ?? []).map((t) => ({ tagId: t.id, label: t.name, count: t.votes })),
    })
    return built.halls.length ? built : STATIC_MOCK.sessionHeatmap
  })()

  const state = {
    ...STATIC_MOCK,
    ...snap,
    voting,
    sessionHeatmap,
    tagMoodBars: snap.tagMoodBars?.length ? snap.tagMoodBars : STATIC_MOCK.tagMoodBars,
  }

  const avatarsForVote = Object.values(MOCK_SPEAKERS).map((s) => ({ id: s.id, initials: s.initials, color: s.color }))
  const heatSpeakers = [MOCK_SPEAKERS.a, MOCK_SPEAKERS.b, MOCK_SPEAKERS.e].map((s) => ({ initials: s.initials, color: s.color }))

  return (
    <div className="pulse-shell">
      {/* Snapshot banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: 'rgba(251,191,36,0.92)', backdropFilter: 'blur(6px)',
        padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 600, color: '#1a1a1a',
      }}>
        <span>📸 СНИМОК · {savedTime} МСК{ageMin !== null ? ` · ${ageMin} мин назад` : ''}</span>
        <a href="/pulse/live" style={{ color: '#1a1a1a', textDecoration: 'underline', opacity: 0.7 }}>
          Открыть LIVE →
        </a>
      </div>

      <div className="pulse-page-outer" style={{ paddingTop: 32 }}>
        <PulseStage visualTest={false} bgDebug={false}>
          <PulseHeader />
          <ProgramNowPanel sessions={state.sessions} />
          <GeoActivityPanel regions={state.geoRegions} />
          <HeroPulsePanel state={state} />
          <TopTagsPanel topTags={state.topTags} filterTabs={state.tagFilterTabs} />
          <SpeakerVotesPanel />
          <SessionInterestHeatmap heat={state.sessionHeatmap} speakerDots={heatSpeakers} activeSessionId={snap.event?.activeSessionId} />
          <TagVotingMoodPanel
            left={{ label: voting.leftDonut.label, percent: voting.leftDonut.percent, votes: voting.leftDonut.votes, trend: voting.leftDonut.trend }}
            right={{ label: voting.rightDonut.label, percent: voting.rightDonut.percent, votes: voting.rightDonut.votes, trend: voting.rightDonut.trend }}
            bars={state.topTags.map((t) => ({ name: t.name, value: t.votes > 0 ? Math.round((t.votes / Math.max(...state.topTags.map((x) => x.votes), 1)) * 100) : 0 }))}
            avatarSlices={avatarsForVote}
          />
        </PulseStage>
      </div>
    </div>
  )
}
