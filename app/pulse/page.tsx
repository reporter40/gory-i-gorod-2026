'use client'
import { useState, useEffect, useCallback } from 'react'
import { SESSIONS, BLOCK_LABELS } from '@/lib/data'
import { TAG_LABELS, TAG_COLORS, TagType } from '@/lib/types'
import { LogoIIntegration } from '@/components/Logos'

const ALL_TAGS = Object.entries(TAG_LABELS) as [TagType, string][]

interface PulseData {
  tagCounts: Record<string, number>
  synthesis: { synthesis_text: string; generated_at: string; tag_count: number } | null
  totalTags: number
}

const BLOCK_DOT: Record<string, string> = {
  tourism: '#2563eb', quality: '#16a34a', creative: '#9333ea',
  infra: '#ea580c', cases: '#0891b2',
}

export default function PulsePage() {
  const [activeSession, setActiveSession] = useState(SESSIONS[0].id)
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [pulseData, setPulseData] = useState<PulseData>({ tagCounts: {}, synthesis: null, totalTags: 0 })
  const [showModal, setShowModal] = useState(false)

  const session = SESSIONS.find(s => s.id === activeSession)!
  const totalTags = Object.values(pulseData.tagCounts).reduce((a, b) => a + b, 0)

  const fetchPulse = useCallback(async () => {
    try {
      const res = await fetch(`/api/pulse?session_id=${activeSession}`)
      if (res.ok) setPulseData(await res.json())
    } catch { /* noop */ }
  }, [activeSession])

  useEffect(() => {
    fetchPulse()
    const t = setInterval(fetchPulse, 10000)
    return () => clearInterval(t)
  }, [fetchPulse])

  async function handleSend() {
    if (!selectedTag) return
    setSending(true)
    try {
      await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSession, tag_type: selectedTag, comment }),
      })
      setSent(true)
      setShowModal(false)
      setSelectedTag(null)
      setComment('')
      await fetchPulse()
      setTimeout(() => setSent(false), 4000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="subhead text-white/50">Уникальная фича</p>
            <div className="flex items-center gap-1.5 text-[10px] bg-white/10 rounded-full px-3 py-1">
              <span className="blink text-green-400">●</span>
              <span className="text-white/80">live · {pulseData.totalTags} реакций</span>
            </div>
          </div>
          <h1 className="heading text-white mb-1">Городской Пульс</h1>
          <p className="text-white/60 text-sm">
            Тегируй идеи → AI строит консенсус аудитории
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* Session picker */}
        <div className="card-flat overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <p className="subhead">Выбери сессию</p>
          </div>
          <div className="divide-y divide-gray-100">
            {SESSIONS.map(s => (
              <button key={s.id} onClick={() => { setActiveSession(s.id); setSent(false) }}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                  activeSession === s.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: BLOCK_DOT[s.block] }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${activeSession === s.id ? 'text-[#0f1f3d]' : 'text-gray-700'}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    День {s.day} · {s.hall} · {BLOCK_LABELS[s.block]}
                  </div>
                </div>
                {activeSession === s.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={() => setShowModal(true)}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm forum-gradient shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Тегировать идею
        </button>

        {sent && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Реакция записана — AI обновит консенсус
          </div>
        )}

        {/* Tag distribution */}
        {totalTags > 0 && (
          <div className="card p-4">
            <p className="subhead mb-3">Реакции аудитории</p>
            <div className="space-y-2">
              {ALL_TAGS.map(([type, label]) => {
                const count = pulseData.tagCounts[type] || 0
                if (count === 0) return null
                const pct = Math.round((count / totalTags) * 100)
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-32 text-right flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="heatbar h-full rounded-full" style={{ width: `${pct}%`, background: TAG_COLORS[type] }} />
                    </div>
                    <span className="text-xs font-mono text-gray-400 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI synthesis */}
        {pulseData.synthesis ? (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <LogoIIntegration size={18} />
              <p className="subhead">AI-консенсус</p>
              <span className="ml-auto text-[10px] text-gray-400">{pulseData.synthesis.tag_count} реакций</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{pulseData.synthesis.synthesis_text}</p>
            <p className="text-[10px] text-gray-400 mt-3">
              Обновлено {new Date(pulseData.synthesis.generated_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              {' · '}Powered by Claude AI
            </p>
          </div>
        ) : (
          <div className="card-flat p-4 text-center">
            <p className="text-gray-500 text-sm mb-1">
              {totalTags >= 3 ? 'AI анализирует реакции…' : `Нужно ${3 - totalTags} реакций для AI-синтеза`}
            </p>
            <p className="text-xs text-gray-400">Тегируй идеи — консенсус появится здесь</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white w-full rounded-t-3xl px-5 pt-4 pb-8 max-h-[88vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <p className="subhead mb-1">Тегировать идею</p>
            <p className="text-sm text-gray-600 mb-5 leading-snug">{session.title}</p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {ALL_TAGS.map(([type, label]) => (
                <button key={type} onClick={() => setSelectedTag(selectedTag === type ? null : type)}
                  className="tag-pill justify-center text-center"
                  style={{
                    background: selectedTag === type ? TAG_COLORS[type] + '18' : '#f9fafb',
                    color: TAG_COLORS[type],
                    borderColor: selectedTag === type ? TAG_COLORS[type] : '#e5e7eb',
                  }}>
                  {selectedTag === type && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {label}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="subhead block mb-1.5">Комментарий <span className="normal-case font-normal text-gray-400">(необязательно)</span></span>
              <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, 80))}
                placeholder="В нашем городе это уже работает / пробовали, но…"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-16 focus:outline-none focus:border-gray-400 transition-colors" />
              <div className="text-right text-[10px] text-gray-400 mt-1">{comment.length}/80</div>
            </label>

            <button onClick={handleSend} disabled={!selectedTag || sending}
              className="w-full py-4 rounded-2xl text-white font-semibold text-sm forum-gradient disabled:opacity-40 transition-opacity mt-3">
              {sending ? 'Отправляем…' : 'Отправить'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
