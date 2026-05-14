'use client'

import { useEffect, useState, useCallback } from 'react'
import { SPEAKERS } from '@/lib/data'
import { voteForTag, flushOfflineQueue, type VoteResult } from '@/lib/pulse/vote-client'
import { ensureAnonymousAuth, hasFirebaseConfig } from '@/lib/pulse/firebase/client'

const TAGS = [
  { id: 'implement',  name: 'Хочу внедрить',  icon: '🔥', color: '#f97316' },
  { id: 'discovery',  name: 'Открытие',        icon: '💡', color: '#f5c518' },
  { id: 'partner',    name: 'Ищу партнёров',   icon: '🤝', color: '#22c55e' },
  { id: 'question',   name: 'Есть вопрос',     icon: '❓', color: '#a855f7' },
  { id: 'applicable', name: 'Применимо у нас', icon: '📍', color: '#4a9eca' },
]

interface ActiveSession {
  id: string
  title: string
  speakerName: string
  speakerId?: string
  hall: string
}

type ToastType = 'success' | 'warn' | 'error'

export default function PulsePage() {
  const [userId, setUserId]           = useState<string | null>(null)
  const [session, setSession]         = useState<ActiveSession | null>(null)
  const [loading, setLoading]         = useState(true)
  const [frozen, setFrozen]           = useState(false)
  const [tagCounts, setTagCounts]     = useState<Record<string, number>>({})
  const [votedTags, setVotedTags]     = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Set<string>>(new Set())
  const [toasts, setToasts]           = useState<{ text: string; type: ToastType; id: number }[]>([])

  function toast(text: string, type: ToastType = 'success') {
    const id = Date.now()
    setToasts(p => [...p, { text, type, id }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800)
  }

  useEffect(() => {
    async function init() {
      // Mock mode (no Firebase config)
      if (!hasFirebaseConfig()) {
        setUserId('mock-user')
        setSession({ id: 'mock-1', title: 'Будущее городов в новой реальности', speakerName: 'А. Иванова', hall: 'Главный зал' })
        setLoading(false)
        return
      }

      try {
        const uid = await ensureAnonymousAuth()
        setUserId(uid)
        const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
        const { ref, get, onValue } = await import('firebase/database')
        const db = getFirebaseDb()

        // Subscribe to frozen state
        onValue(ref(db, 'event/frozen'), s => setFrozen(!!s.val()))

        // Subscribe to active session changes (organizer switches speaker)
        onValue(ref(db, 'event/activeSessionId'), async snap => {
          const sid = snap.val() as string | null
          if (!sid) { setSession(null); setLoading(false); return }

          const [ss, vs] = await Promise.all([
            get(ref(db, `sessions/${sid}`)),
            get(ref(db, `votes/${sid}`)),
          ])
          const sd = ss.val() as { title: string; speakerId?: string; hall: string } | null
          if (!sd) { setSession(null); setLoading(false); return }

          let spName = ''
          if (sd.speakerId) {
            try {
              const sp = await get(ref(db, `speakers/${sd.speakerId}`))
              spName = (sp.val() as { name?: string } | null)?.name ?? ''
            } catch {}
          }

          setSession({ id: sid, title: sd.title, speakerName: spName, speakerId: sd.speakerId, hall: sd.hall })
          setTagCounts((vs.val() as Record<string, number> | null) ?? {})

          // Restore voted tags from localStorage
          const av = new Set<string>()
          TAGS.forEach(t => {
            if (localStorage.getItem(`pulse_voted_${sid}_${t.id}_${uid}`) === '1') av.add(t.id)
          })
          setVotedTags(av)
          setPendingTags(new Set())
          setLoading(false)

          // Live vote counts for this session
          onValue(ref(db, `votes/${sid}`), s => {
            setTagCounts((s.val() as Record<string, number> | null) ?? {})
          })
        })

        flushOfflineQueue()
      } catch (e) {
        console.error(e)
        toast('Ошибка подключения', 'error')
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVote = useCallback(async (tagId: string) => {
    if (!userId || !session) return
    if (votedTags.has(tagId)) { toast('Уже учтено', 'warn'); return }
    if (frozen) { toast('Голосование приостановлено', 'warn'); return }
    if (pendingTags.has(tagId)) return
    setPendingTags(p => new Set(p).add(tagId))
    const r: VoteResult = await voteForTag({ sessionId: session.id, tagId, userId })
    setPendingTags(p => { const n = new Set(p); n.delete(tagId); return n })
    if (r.ok) {
      setVotedTags(p => new Set(p).add(tagId))
      toast('Голос принят! 🎉', 'success')
    } else if (r.status === 'duplicate') {
      setVotedTags(p => new Set(p).add(tagId))
    } else if (r.status === 'rate_limited') {
      toast('Подождите немного', 'warn')
    } else if (r.status === 'offline') {
      toast('Офлайн — голос сохранён', 'warn')
    } else {
      toast('Ошибка, попробуйте снова', 'error')
    }
  }, [userId, session, votedTags, frozen, pendingTags])

  const totalVotes = Object.values(tagCounts).reduce((a, b) => a + b, 0)
  const speaker = session?.speakerId ? SPEAKERS.find(s => s.id === session.speakerId) : null

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
          <span className="glow-chip" style={{ marginBottom: 12, display: 'inline-flex' }}>
            <span className="blink" style={{ color: frozen ? '#ef4444' : '#f5c518' }}>●</span>
            {frozen ? 'ПРИОСТАНОВЛЕНО' : 'LIVE · ПУЛЬС'}
          </span>
          <h1 className="heading text-white">Реакция зала</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">

        {/* Current speaker card */}
        {loading ? (
          <div className="card p-5" style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Загрузка...
          </div>
        ) : !session ? (
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 12 }}>⏳</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Сессия ещё не началась</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Когда организаторы запустят сессию,<br />здесь появится спикер и кнопки голосования
            </p>
          </div>
        ) : (
          <>
            {/* Speaker on stage */}
            <div className="card p-5" style={{ borderColor: 'rgba(245,197,24,0.25)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#f5c518', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                ⚡ Сейчас на сцене
              </p>
              <div className="flex items-start gap-3">
                {speaker?.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={speaker.photo_url} alt={speaker.name}
                    className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                    style={{ filter: 'grayscale(20%) brightness(1.05)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <h2 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.3, marginBottom: 6 }}>
                    {session.title}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {[session.speakerName, session.hall].filter(Boolean).join(' · ')}
                  </p>
                  {speaker?.role && (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.4 }}>
                      {speaker.role}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Voting */}
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
                    const count   = tagCounts[tag.id] ?? 0
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
                            <span style={{ fontSize: 14, fontWeight: voted ? 700 : 500, color: voted ? tag.color : 'var(--text)' }}>
                              {tag.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {pct > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{pct}%</span>}
                            <span style={{
                              fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                              color: voted ? tag.color : 'var(--text-3)',
                              background: voted ? `${tag.color}20` : 'transparent',
                              border: `1px solid ${voted ? tag.color + '40' : 'transparent'}`,
                              borderRadius: 8, padding: '2px 8px',
                            }}>
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
                    {totalVotes} {totalVotes === 1 ? 'голос' : totalVotes < 5 ? 'голоса' : 'голосов'} по этой сессии
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
