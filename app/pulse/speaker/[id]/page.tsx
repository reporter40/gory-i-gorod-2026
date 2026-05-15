'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { SPEAKERS, SESSIONS } from '@/lib/data'
import { ensureAnonymousAuth, hasFirebaseConfig, getFirebaseAuth, getFirebaseDb } from '@/lib/pulse/firebase/client'

const TAGS = [
  { id: 'implement',  name: 'Хочу внедрить',  icon: '🔥', desc: 'Беру в работу прямо сейчас' },
  { id: 'discovery',  name: 'Открытие',        icon: '💡', desc: 'Узнал что-то принципиально новое' },
  { id: 'partner',    name: 'Ищу партнёров',   icon: '🤝', desc: 'Готов к сотрудничеству по теме' },
  { id: 'question',   name: 'Есть вопрос',     icon: '❓', desc: 'Хочу уточнить, осталось непонятым' },
  { id: 'applicable', name: 'Применимо у нас', icon: '📍', desc: 'Подходит для моего города / проекта' },
]

const STORAGE_PREFIX = 'sv_'

function getLocalVote(speakerId: string, uid: string): string | null {
  try { return localStorage.getItem(`${STORAGE_PREFIX}${speakerId}_${uid}`) } catch { return null }
}
function setLocalVote(speakerId: string, uid: string, tagId: string) {
  try { localStorage.setItem(`${STORAGE_PREFIX}${speakerId}_${uid}`, tagId) } catch {}
}

export default function SpeakerVotePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const speaker = SPEAKERS.find(s => s.id === id)
  const sessions = SESSIONS.filter(s => s.speaker_id === id)

  const [uid, setUid] = useState<string | null>(null)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'vote' | 'result'>('vote')
  const unsubRef = useRef<(() => void) | null>(null)

  // Real-time listener on speakerVotes counts
  const subscribeToLiveCounts = useCallback(() => {
    if (!hasFirebaseConfig()) return
    import('firebase/database').then(({ ref, onValue }) => {
      const db = getFirebaseDb()
      const countsRef = ref(db, `speakerVotes/${id}/counts`)
      const unsub = onValue(countsRef, snap => {
        const val = snap.val() as Record<string, number> | null
        setCounts(val ?? {})
      })
      unsubRef.current = unsub
    }).catch(console.error)
  }, [id])

  useEffect(() => {
    return () => { unsubRef.current?.() }
  }, [id])

  // Load uid + check existing vote
  useEffect(() => {
    async function init() {
      let resolvedUid: string
      if (hasFirebaseConfig()) {
        resolvedUid = await ensureAnonymousAuth()
      } else {
        resolvedUid = 'mock-user'
      }
      setUid(resolvedUid)
      const existing = getLocalVote(id, resolvedUid)
      if (existing) {
        setMyVote(existing)
        setPhase('result')
        subscribeToLiveCounts()
      }
    }
    init().catch(console.error)
  }, [id, subscribeToLiveCounts])

  const loadCounts = useCallback(() => {
    subscribeToLiveCounts()
  }, [subscribeToLiveCounts])

  async function handleVote(tagId: string) {
    if (!uid || myVote || pending) return
    setPending(true)
    setError('')

    try {
      if (!hasFirebaseConfig()) {
        setLocalVote(id, uid, tagId)
        setMyVote(tagId)
        setCounts(prev => ({ ...prev, [tagId]: (prev[tagId] ?? 0) + 1 }))
        setPhase('result')
        return
      }

      // Write directly via Firebase client SDK (no Admin SDK needed)
      const { ref, runTransaction, set, get } = await import('firebase/database')
      const db = getFirebaseDb()

      // Dedup: write-once userVotes (Firebase rules block second write)
      const userVoteRef = ref(db, `speakerVotes/${id}/userVotes/${uid}`)
      const existing = await get(userVoteRef)
      if (existing.exists()) {
        // Already voted — restore state from Firebase
        setLocalVote(id, uid, existing.val() as string)
        setMyVote(existing.val() as string)
        setPhase('result')
        subscribeToLiveCounts()
        return
      }

      // Write user marker (write-once enforced by rules)
      await set(userVoteRef, tagId)

      // Increment speaker counter atomically
      const countRef = ref(db, `speakerVotes/${id}/counts/${tagId}`)
      await runTransaction(countRef, cur => {
        const n = typeof cur === 'number' && Number.isFinite(cur) ? cur : 0
        return n + 1
      })

      // Also write to global votes + timeline (feeds dashboard panels)
      try {
        const activeSnap = await get(ref(db, 'event/activeSessionId'))
        const activeSessionId = activeSnap.val() as string | null
        if (activeSessionId) {
          await runTransaction(ref(db, `votes/${activeSessionId}/${tagId}`), cur => {
            const n = typeof cur === 'number' && Number.isFinite(cur) ? cur : 0
            return n + 1
          })
          const mskHour = (new Date().getUTCHours() + 3) % 24
          const slot = `${String(mskHour).padStart(2, '0')}:00`
          await runTransaction(ref(db, `voteTimeline/${tagId}/${slot}`), cur => {
            const n = typeof cur === 'number' && Number.isFinite(cur) ? cur : 0
            return n + 1
          })
        }
      } catch {}

      setLocalVote(id, uid, tagId)
      setMyVote(tagId)
      setPhase('result')
      subscribeToLiveCounts()
    } catch {
      setError('Нет соединения. Попробуйте ещё раз.')
    } finally {
      setPending(false)
    }
  }

  if (!speaker) {
    return (
      <div style={{ minHeight: '100dvh', background: '#050b18', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Спикер не найден</div>
        <button onClick={() => router.push('/pulse')} style={{ marginTop: 8, padding: '12px 24px', borderRadius: 12, background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ← К списку
        </button>
      </div>
    )
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const initials = speaker.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 65%)',
      color: '#f0f6ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => router.push('/pulse')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 16,
          }}>
            ← Все доклады
          </button>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            AI‑Пульс · Оценка доклада
          </div>

          {/* Speaker card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))',
              border: '1px solid rgba(0,212,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#00d4ff',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {speaker.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                {speaker.role}{speaker.city ? ` · ${speaker.city}` : ''}
              </div>
            </div>
          </div>

          {sessions.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                {sessions[0].title}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {new Date(sessions[0].starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                {sessions[0].hall ? ` · ${sessions[0].hall}` : ''}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '24px 24px 0' }}>
          {phase === 'vote' ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
                Ваша реакция на доклад
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TAGS.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleVote(tag.id)}
                    disabled={pending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 18px', borderRadius: 18,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: pending ? 'wait' : 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.25,0.46,0.45,0.94)',
                      textAlign: 'left',
                      opacity: pending ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                      if (!pending) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.07)'
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.25)'
                        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'
                      ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                    }}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, width: 36, textAlign: 'center' }}>{tag.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff' }}>{tag.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{tag.desc}</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff', fontSize: 16, flexShrink: 0 }}>
                      →
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Result phase */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 12, animation: 'pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  {TAGS.find(t => t.id === myVote)?.icon ?? '✓'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  Голос принят!
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                  Вы отметили: <span style={{ color: '#00d4ff', fontWeight: 600 }}>{TAGS.find(t => t.id === myVote)?.name}</span>
                </div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>
                Результаты — {total} {total === 1 ? 'голос' : total < 5 ? 'голоса' : 'голосов'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TAGS.map(tag => {
                  const cnt = counts[tag.id] ?? 0
                  const pct = total > 0 ? Math.round((cnt / total) * 100) : 0
                  const isMyVote = tag.id === myVote
                  return (
                    <div key={tag.id} style={{
                      padding: '14px 16px', borderRadius: 16,
                      background: isMyVote ? 'rgba(0,212,255,0.07)' : 'rgba(255,255,255,0.03)',
                      border: isMyVote ? '1px solid rgba(0,212,255,0.25)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{tag.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: isMyVote ? '#00d4ff' : '#f0f6ff' }}>{tag.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isMyVote ? '#00d4ff' : 'rgba(255,255,255,0.5)' }}>{pct}%</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>{cnt}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: isMyVote ? 'linear-gradient(90deg, #00d4ff, #0066ff)' : 'rgba(255,255,255,0.2)',
                          width: `${pct}%`,
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                          boxShadow: isMyVote ? '0 0 8px rgba(0,212,255,0.5)' : 'none',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => router.push('/pulse')}
                style={{
                  marginTop: 28, width: '100%', padding: '16px',
                  borderRadius: 14, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                ← Оценить другой доклад
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pop {
          from { transform: scale(0) rotate(-10deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
