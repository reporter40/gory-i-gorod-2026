'use client'

import { useEffect, useState, useCallback } from 'react'
import { voteForTag, flushOfflineQueue, type VoteResult } from '@/lib/pulse/vote-client'
import { ensureAnonymousAuth, hasFirebaseConfig } from '@/lib/pulse/firebase/client'

interface TagCard { id: string; name: string; icon: string; votes: number }
interface SessionInfo { id: string; title: string; speakerName: string; hall: string }

const TAGS: TagCard[] = [
  { id: 'implement',  name: 'Хочу внедрить',  icon: '🔥', votes: 0 },
  { id: 'discovery',  name: 'Открытие',        icon: '💡', votes: 0 },
  { id: 'partner',    name: 'Ищу партнёров',   icon: '🤝', votes: 0 },
  { id: 'question',   name: 'Есть вопрос',     icon: '❓', votes: 0 },
  { id: 'applicable', name: 'Применимо у нас', icon: '📍', votes: 0 },
]

const TAG_COLORS: Record<string, string> = {
  implement: '#f97316', discovery: '#f5c518', partner: '#22c55e',
  question: '#a855f7', applicable: '#4a9eca',
}

type ToastType = 'success' | 'warn' | 'error'
interface ToastMsg { text: string; type: ToastType; id: number }

export default function PulsePage() {
  const [userId, setUserId]           = useState<string | null>(null)
  const [session, setSession]         = useState<SessionInfo | null>(null)
  const [tags, setTags]               = useState<TagCard[]>(TAGS)
  const [votedTags, setVotedTags]     = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Set<string>>(new Set())
  const [frozen, setFrozen]           = useState(false)
  const [toasts, setToasts]           = useState<ToastMsg[]>([])
  const [loading, setLoading]         = useState(true)

  function toast(text: string, type: ToastType = 'success') {
    const id = Date.now()
    setToasts(p => [...p, { text, type, id }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800)
  }

  useEffect(() => {
    async function init() {
      if (!hasFirebaseConfig()) {
        setUserId('mock-user')
        setSession({ id: 'session-1', title: 'Будущее городов в новой реальности', speakerName: 'А. Иванова', hall: 'Главный зал' })
        setLoading(false)
        return
      }
      try {
        const uid = await ensureAnonymousAuth()
        setUserId(uid)
        const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
        const { ref, get, onValue } = await import('firebase/database')
        const db = getFirebaseDb()
        onValue(ref(db, 'event/frozen'), s => setFrozen(!!s.val()))
        const ev = await get(ref(db, 'event'))
        const evData = ev.val() as { activeSessionId?: string } | null
        if (!evData?.activeSessionId) { setLoading(false); return }
        const sid = evData.activeSessionId
        const [ss, vs] = await Promise.all([
          get(ref(db, `sessions/${sid}`)),
          get(ref(db, `votes/${sid}`)),
        ])
        const sd = ss.val() as { title: string; speakerId: string; hall: string } | null
        if (!sd) { setLoading(false); return }
        let spName = ''
        try {
          const sp = await get(ref(db, `speakers/${sd.speakerId}`))
          spName = (sp.val() as { name?: string } | null)?.name ?? ''
        } catch {}
        setSession({ id: sid, title: sd.title, speakerName: spName, hall: sd.hall })
        const vd = (vs.val() as Record<string, number> | null) ?? {}
        setTags(p => p.map(t => ({ ...t, votes: vd[t.id] ?? 0 })))
        const av = new Set<string>()
        TAGS.forEach(t => {
          if (localStorage.getItem(`pulse_voted_${sid}_${t.id}_${uid}`) === '1') av.add(t.id)
        })
        setVotedTags(av)
        onValue(ref(db, `votes/${sid}`), s => {
          const c = (s.val() as Record<string, number> | null) ?? {}
          setTags(p => p.map(t => ({ ...t, votes: c[t.id] ?? t.votes })))
        })
        flushOfflineQueue()
      } catch (e) {
        console.error(e)
        toast('Ошибка подключения', 'error')
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVote = useCallback(async (tagId: string) => {
    if (!userId || !session) return
    if (votedTags.has(tagId)) { toast('Вы уже голосовали за этот тег', 'warn'); return }
    if (frozen) { toast('Голосование приостановлено', 'warn'); return }
    if (pendingTags.has(tagId)) return
    setPendingTags(p => new Set(p).add(tagId))
    const r: VoteResult = await voteForTag({ sessionId: session.id, tagId, userId })
    setPendingTags(p => { const n = new Set(p); n.delete(tagId); return n })
    if (r.ok) {
      setVotedTags(p => new Set(p).add(tagId))
      setTags(p => p.map(t => t.id === tagId ? { ...t, votes: t.votes + 1 } : t))
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
  }, [userId, session, votedTags, frozen, pendingTags])

  const totalVotes = tags.reduce((s, t) => s + t.votes, 0)

  return (
    <div className="min-h-screen pb-nav" style={{ background: 'var(--bg)' }}>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? '#166534' : t.type === 'warn' ? '#854d0e' : '#7f1d1d',
            border: `1px solid ${t.type === 'success' ? '#22c55e' : t.type === 'warn' ? '#f5c518' : '#ef4444'}44`,
            color: '#fff', borderRadius: 12, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>{t.text}</div>
        ))}
      </div>

      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="glow-chip">
              <span className="blink" style={{ color: frozen ? '#ef4444' : '#f5c518' }}>●</span>
              {frozen ? 'ПРИОСТАНОВЛЕНО' : 'LIVE · ПУЛЬС'}
            </span>
          </div>
          <h1 className="heading text-white">Реакция зала</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">

        {/* Current session card */}
        {loading ? (
          <div className="card p-5" style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Загрузка сессии...
          </div>
        ) : session ? (
          <div className="card p-5" style={{ borderColor: 'rgba(245,197,24,0.2)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#f5c518', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              ⚡ Сейчас на сцене
            </p>
            <h2 style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', lineHeight: 1.35, marginBottom: 12 }}>
              {session.title}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
              {[session.speakerName, session.hall].filter(Boolean).join(' · ')}
            </div>
          </div>
        ) : (
          <div className="card p-5" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 10 }}>⏳</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Сессия ещё не началась</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Организаторы активируют голосование</p>
          </div>
        )}

        {/* Voting tags */}
        {session && !frozen && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Ваша реакция на доклад
            </p>
            <div className="space-y-3">
              {tags.map(tag => {
                const color = TAG_COLORS[tag.id] ?? '#4a9eca'
                const voted = votedTags.has(tag.id)
                const pending = pendingTags.has(tag.id)
                const pct = totalVotes > 0 ? Math.round((tag.votes / totalVotes) * 100) : 0
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleVote(tag.id)}
                    disabled={pending}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: voted ? `${color}18` : 'var(--surface)',
                      border: `1px solid ${voted ? color + '55' : 'var(--border)'}`,
                      borderRadius: 16, padding: '14px 16px',
                      cursor: pending ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {/* Progress bar background */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${pct}%`, background: `${color}12`,
                      transition: 'width 0.6s ease', borderRadius: 16,
                    }} />
                    <div className="flex items-center justify-between" style={{ position: 'relative' }}>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 22 }}>{tag.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: voted ? 700 : 500, color: voted ? color : 'var(--text)' }}>
                          {tag.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pct > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{pct}%</span>
                        )}
                        <span style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                          color: voted ? color : 'var(--text-3)',
                          background: voted ? `${color}20` : 'transparent',
                          border: voted ? `1px solid ${color}40` : '1px solid transparent',
                          borderRadius: 8, padding: '2px 8px',
                        }}>
                          {pending ? '…' : tag.votes}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Frozen state */}
        {frozen && session && (
          <div className="card p-5" style={{ textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
            <p style={{ fontSize: 20, marginBottom: 8 }}>⏸</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Голосование приостановлено</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Организаторы возобновят его скоро</p>
          </div>
        )}

        {/* Total votes */}
        {totalVotes > 0 && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {totalVotes} {totalVotes === 1 ? 'голос' : totalVotes < 5 ? 'голоса' : 'голосов'} по текущей сессии
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
