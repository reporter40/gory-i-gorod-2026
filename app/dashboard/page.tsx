'use client'
import { useState, useEffect, useCallback } from 'react'
import { SESSIONS } from '@/lib/data'
import { TAG_LABELS, TAG_COLORS, TagType } from '@/lib/types'
import { LogoInnopolis, LogoGelendzhikArena, LogoIIntegration } from '@/components/Logos'

interface Summary { session_id: string; session_title: string; tag_count: number; latest_synthesis: string | null }
interface Overview { summary: Summary[]; totalTags: number }

const ALL_TAGS = Object.keys(TAG_LABELS) as TagType[]

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview>({ summary: [], totalTags: 0 })
  const [digest, setDigest] = useState('')
  const [digestLoading, setDigestLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/pulse')
      if (res.ok) setOverview(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchOverview()
    const t = setInterval(fetchOverview, 15000)
    return () => clearInterval(t)
  }, [fetchOverview])

  const daySessions = SESSIONS.filter(s => s.day === selectedDay)
  const daySummaries = overview.summary.filter(s => daySessions.some(ds => ds.id === s.session_id))
  const dayTotalTags = daySummaries.reduce((sum, s) => sum + s.tag_count, 0)
  const maxTags = Math.max(...overview.summary.map(s => s.tag_count), 1)

  async function handleDigest() {
    setDigestLoading(true)
    setDigest('')
    try {
      const sessionSyntheses = daySummaries
        .filter(s => s.latest_synthesis)
        .map(s => ({ title: s.session_title, synthesis: s.latest_synthesis!, tagCount: s.tag_count }))
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDay, sessionSyntheses }),
      })
      if (res.ok) setDigest((await res.json()).digest)
    } finally {
      setDigestLoading(false)
    }
  }

  const kpis = [
    { label: 'Реакций', value: overview.totalTags },
    { label: 'Активных сессий', value: overview.summary.filter(s => s.tag_count > 0).length },
    { label: 'AI-синтезов', value: overview.summary.filter(s => s.latest_synthesis).length },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead text-white/50 mb-2">Организаторам</p>
          <h1 className="heading text-white mb-4">Аналитика форума</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 opacity-60">
              <LogoInnopolis size={16} />
              <span className="text-xs text-white">Иннополис</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <LogoGelendzhikArena size={16} />
              <span className="text-xs text-white">Геленджик Арена</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <LogoIIntegration size={14} />
              <span className="text-xs text-white">ИИнтеграция</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {kpis.map(({ label, value }) => (
            <div key={label} className="card-flat p-3 text-center">
              <div className="text-2xl font-bold text-[#0f1f3d]">{value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
          <span className="blink text-green-500">●</span>
          Данные обновляются каждые 15 сек
        </div>

        {/* Day selector */}
        <div className="flex gap-2">
          {[1, 2].map(d => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                selectedDay === d ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]' : 'bg-white text-gray-500 border-gray-200'
              }`}>
              День {d}
            </button>
          ))}
        </div>

        {/* Heatmap */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="subhead">Тепловая карта</p>
            <span className="text-xs text-gray-400">{dayTotalTags} реакций</span>
          </div>
          <div className="space-y-2.5">
            {daySessions.map(session => {
              const s = overview.summary.find(x => x.session_id === session.id)
              const count = s?.tag_count || 0
              const pct = Math.round((count / maxTags) * 100)
              return (
                <div key={session.id}>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span className="truncate max-w-[200px]">{session.title}</span>
                    <span className="font-mono flex-shrink-0 ml-2">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                        background: `linear-gradient(90deg, #0f1f3d, #2563eb)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tag distribution */}
        <div className="card p-4">
          <p className="subhead mb-3">Настроение аудитории</p>
          <div className="space-y-2">
            {ALL_TAGS.map(tagType => {
              const label = TAG_LABELS[tagType]
              const color = TAG_COLORS[tagType]
              const mockCount = [5, 3, 7, 2, 8, 4][ALL_TAGS.indexOf(tagType)] || 3
              return (
                <div key={tagType} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 text-right flex-shrink-0 truncate">{label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="heatbar" style={{ width: `${mockCount * 11}%`, background: color }} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">{mockCount}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI syntheses per session */}
        <div className="card p-4">
          <p className="subhead mb-3">Консенсус по сессиям</p>
          <div className="space-y-3">
            {daySessions.map(session => {
              const s = overview.summary.find(x => x.session_id === session.id)
              return (
                <div key={session.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs font-semibold text-[#0f1f3d] mb-1 leading-snug">{session.title}</p>
                  {s?.latest_synthesis ? (
                    <p className="text-xs text-gray-600 leading-relaxed">{s.latest_synthesis}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      {s?.tag_count ? `${s.tag_count} реакций, анализ скоро` : 'Реакций пока нет'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Digest */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <LogoIIntegration size={16} />
            <p className="subhead">Дайджест дня {selectedDay}</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Claude AI синтезирует все реакции и консенсусы в сводку дня
          </p>
          <button onClick={handleDigest} disabled={digestLoading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold forum-gradient disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            {digestLoading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Генерирую…
              </>
            ) : '✦ Сгенерировать дайджест'}
          </button>
          {digest && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-200">
              {digest}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
