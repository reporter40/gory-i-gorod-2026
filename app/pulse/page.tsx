'use client'

import { useEffect, useState, useCallback } from 'react'
import { SESSIONS, SPEAKERS } from '@/lib/data'
import { voteForTag, flushOfflineQueue, type VoteResult } from '@/lib/pulse/vote-client'
import { ensureAnonymousAuth, hasFirebaseConfig } from '@/lib/pulse/firebase/client'

const TAGS = [
  { id: 'implement',  name: 'Хочу внедрить',  icon: '🔥', color: '#f97316' },
  { id: 'discovery',  name: 'Открытие',        icon: '💡', color: '#f5c518' },
  { id: 'partner',    name: 'Ищу партнёров',   icon: '🤝', color: '#22c55e' },
  { id: 'question',   name: 'Есть вопрос',     icon: '❓', color: '#a855f7' },
  { id: 'applicable', name: 'Применимо у нас', icon: '📍', color: '#4a9eca' },
]

const BLOCK_COLOR: Record<string, string> = {
  tourism: '#4a9eca', quality: '#22c55e', creative: '#a855f7',
  infra: '#f97316',   cases: '#06b6d4',
}

type ToastType = 'success' | 'warn' | 'error'

// Sessions eligible for voting (exclude title_only and org-only slots with no title)
const VOTABLE = SESSIONS.filter(s => s.program_card !== 'title_only' && s.title?.trim())

export default function PulsePage() {
  const [day, setDay]                   = useState(1)
  const [view, setView]                 = useState<'list' | 'vote'>('list')
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [userId, setUserId]             = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [frozen, setFrozen]             = useState(false)
  // votes: sessionId → tagId → count
  const [votes, setVotes]               = useState<Record<string, Record<string, number>>>({})
  const [votedTags, setVotedTags]       = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags]   = useState<Set<string>>(new Set())
  const [toasts, setToasts]             = useState<{ text: string; type: ToastType; id: number }[]>([])

  function toast(text: string, type: ToastType = 'success') {
    const id = Date.now()
    setToasts(p => [...p, { text, type, id }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800)
  }

  // Init Firebase subscriptions
  useEffect(() => {
    async function init() {
      if (!hasFirebaseConfig()) {
        setUserId('mock-user')
        setActiveSessionId(VOTABLE[2]?.id ?? null)
        return
      }
      try {
        const uid = await ensureAnonymousAuth()
        setUserId(uid)
        const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
        const { ref, onValue } = await import('firebase/database')
        const db = getFirebaseDb()
        onValue(ref(db, 'event/frozen'),         s => setFrozen(!!s.val()))
        onValue(ref(db, 'event/activeSessionId'), s => setActiveSessionId(s.val() as string | null))
        onValue(ref(db, 'votes'), s => {
          setVotes((s.val() as Record<string, Record<string, number>> | null) ?? {})
        })
        flushOfflineQueue()
      } catch (e) { console.error(e) }
    }
    init()
  }, [])

  // Load voted tags from localStorage when session changes
  useEffect(() => {
    if (!selectedId || !userId) return
    const av = new Set<string>()
    TAGS.forEach(t => {
      if (localStorage.getItem(`pulse_voted_${selectedId}_${t.id}_${userId}`) === '1') av.add(t.id)
    })
    setVotedTags(av)
  }, [selectedId, userId])

  const openSession = useCallback((id: string) => {
    setSelectedId(id)
    setView('vote')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleVote = useCallback(async (tagId: string) => {
    if (!userId || !selectedId) return
    if (votedTags.has(tagId)) { toast('Уже учтено', 'warn'); return }
    if (frozen) { toast('Голосование приостановлено', 'warn'); return }
    if (pendingTags.has(tagId)) return
    setPendingTags(p => new Set(p).add(tagId))
    const r: VoteResult = await voteForTag({ sessionId: selectedId, tagId, userId })
    setPendingTags(p => { const n = new Set(p); n.delete(tagId); return n })
    if (r.ok) {
      setVotedTags(p => new Set(p).add(tagId))
      toast('Голос принят!', 'success')
    } else if (r.status === 'duplicate') {
      setVotedTags(p => new Set(p).add(tagId))
      toast('Уже учтено', 'warn')
    } else if (r.status === 'rate_limited') {
      toast('Подождите немного', 'warn')
    } else if (r.status === 'offline') {
      toast('Офлайн — голос в очереди', 'warn')
    } else {
      toast('Ошибка, попробуйте снова', 'error')
    }
  }, [userId, selectedId, votedTags, frozen, pendingTags])

  const selectedSession = VOTABLE.find(s => s.id === selectedId)
  const selectedSpeaker = selectedSession ? SPEAKERS.find(sp => sp.id === selectedSession.speaker_id) : null
  const sessionVotes    = selectedId ? (votes[selectedId] ?? {}) : {}
  const totalVotes      = Object.values(sessionVotes).reduce((a, b) => a + b, 0)

  const dayList = VOTABLE.filter(s => s.day === day)

  // ── VOTE VIEW ──────────────────────────────────────────────────────────────
  if (view === 'vote' && selectedSession) {
    const isActive = selectedSession.id === activeSessionId
    return (
      <div className="min-h-screen pb-nav">
        {/* Toasts */}
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: t.type === 'success' ? '#166534' : t.type === 'warn' ? '#854d0e' : '#7f1d1d',
              border: `1px solid ${t.type === 'success' ? '#22c55e40' : t.type === 'warn' ? '#f5c51840' : '#ef444440'}`,
              color: '#fff', borderRadius: 12, padding: '10px 18px',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>{t.text}</div>
          ))}
        </div>

        {/* Header */}
        <div className="forum-gradient text-white px-5 pt-10 pb-6">
          <div className="max-w-md mx-auto">
            <button onClick={() => setView('list')} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              ← НАЗАД К ДОКЛАДАМ
            </button>
            <div className="flex items-center gap-2 mb-2">
              {isActive && (
                <span className="glow-chip">
                  <span className="blink" style={{ color: '#f5c518' }}>●</span>
                  СЕЙЧАС НА СЦЕНЕ
                </span>
              )}
            </div>
            <h1 className="heading text-white" style={{ fontSize: 18, lineHeight: 1.3 }}>
              {selectedSession.title}
            </h1>
            {selectedSpeaker && (
              <p style={{ fontSize: 12, color: 'rgba(238,244,255,0.5)', marginTop: 8 }}>
                {selectedSpeaker.name}{selectedSession.hall ? ` · ${selectedSession.hall}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-5 space-y-4">
          {frozen ? (
            <div className="card p-5" style={{ textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
              <p style={{ fontSize: 20, marginBottom: 8 }}>⏸</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Голосование приостановлено</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Ваша реакция на доклад
              </p>
              <div className="space-y-3">
                {TAGS.map(tag => {
                  const count   = sessionVotes[tag.id] ?? 0
                  const pct     = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                  const voted   = votedTags.has(tag.id)
                  const pending = pendingTags.has(tag.id)
                  return (
                    <button key={tag.id} onClick={() => handleVote(tag.id)} disabled={pending}
                      style={{
                        width: '100%', textAlign: 'left',
                        background: voted ? `${tag.color}18` : 'var(--surface)',
                        border: `1px solid ${voted ? tag.color + '55' : 'var(--border)'}`,
                        borderRadius: 16, padding: '14px 16px',
                        cursor: pending ? 'wait' : 'pointer',
                        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                      }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${tag.color}12`, transition: 'width 0.6s ease', borderRadius: 16 }} />
                      <div className="flex items-center justify-between" style={{ position: 'relative' }}>
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 22 }}>{tag.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: voted ? 700 : 500, color: voted ? tag.color : 'var(--text)' }}>{tag.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pct > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{pct}%</span>}
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: voted ? tag.color : 'var(--text-3)', background: voted ? `${tag.color}20` : 'transparent', border: `1px solid ${voted ? tag.color + '40' : 'transparent'}`, borderRadius: 8, padding: '2px 8px' }}>
                            {pending ? '…' : count}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {totalVotes > 0 && (
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16 }}>
                  {totalVotes} {totalVotes < 5 ? 'голоса' : 'голосов'} по этому докладу
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-nav">
      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="glow-chip">
              <span className="blink" style={{ color: '#f5c518' }}>●</span>
              LIVE · ПУЛЬС
            </span>
          </div>
          <h1 className="heading text-white">Выберите доклад</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3 pb-6">
        {/* Day tabs */}
        <div className="flex gap-2">
          {[{ d: 1, label: '16 мая' }, { d: 2, label: '17 мая' }].map(({ d, label }) => (
            <button key={d} onClick={() => setDay(d)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={day === d
                ? { background: 'var(--accent)', color: '#07101f', border: '1px solid transparent' }
                : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              День {d} · {label}
            </button>
          ))}
        </div>

        {/* Session list */}
        {dayList.map(session => {
          const speaker   = SPEAKERS.find(sp => sp.id === session.speaker_id)
          const isActive  = session.id === activeSessionId
          const svotes    = votes[session.id] ?? {}
          const svTotal   = Object.values(svotes).reduce((a, b) => a + b, 0)
          const blockColor = BLOCK_COLOR[session.block] ?? '#4a9eca'

          return (
            <button key={session.id} onClick={() => openSession(session.id)}
              style={{
                width: '100%', textAlign: 'left',
                background: isActive ? 'rgba(245,197,24,0.06)' : 'var(--surface)',
                border: `1px solid ${isActive ? 'rgba(245,197,24,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '14px 16px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {/* Time + status row */}
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                  {new Date(session.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  {session.hall?.trim() ? ` · ${session.hall}` : ''}
                </span>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#f5c518', background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: 6, padding: '2px 7px', letterSpacing: '0.06em' }}>
                      <span className="blink">●</span> LIVE
                    </span>
                  )}
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: blockColor, display: 'inline-block', flexShrink: 0 }} />
                </div>
              </div>

              {/* Title */}
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8 }}>
                {session.title}
              </p>

              {/* Speaker + vote count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {speaker?.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={speaker.photo_url} alt={speaker.name}
                      className="w-5 h-5 rounded-full object-cover"
                      style={{ filter: 'grayscale(30%)' }} />
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                    {speaker?.name ?? session.speaker_row_note ?? 'Организаторы'}
                  </span>
                </div>
                {svTotal > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                    {svTotal} {svTotal < 5 ? 'голоса' : 'голосов'}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
