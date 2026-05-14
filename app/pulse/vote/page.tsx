'use client'

import { useEffect, useState, useCallback } from 'react'
import { voteForTag, flushOfflineQueue, type VoteResult } from '@/lib/pulse/vote-client'
import { ensureAnonymousAuth, hasFirebaseConfig } from '@/lib/pulse/firebase/client'
import { useConnectionStatus } from '@/lib/pulse/useConnectionStatus'

// --- Types ---
interface TagCard {
  id: string
  name: string
  icon: string
  votes: number
}

interface SessionInfo {
  id: string
  title: string
  speakerName: string
  hall: string
}

const DEFAULT_TAGS: TagCard[] = [
  { id: 'actual', name: 'Актуально', icon: '🔥', votes: 0 },
  { id: 'ppp', name: 'ГЧП / Партнёрство', icon: '🤝', votes: 0 },
  { id: 'innovation', name: 'Инновации', icon: '💡', votes: 0 },
  { id: 'cases', name: 'Кейсы / Практика', icon: '📋', votes: 0 },
  { id: 'invest', name: 'Инвестиции', icon: '💰', votes: 0 },
]

const REGISTRATION_KEY = 'pulse_participant_v1'

interface ParticipantData {
  name: string
  telegram: string
  uid: string
}

function loadRegistration(): ParticipantData | null {
  try {
    const raw = localStorage.getItem(REGISTRATION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveRegistration(data: ParticipantData) {
  try { localStorage.setItem(REGISTRATION_KEY, JSON.stringify(data)) } catch {}
}

async function registerParticipant(data: ParticipantData, sessionId: string) {
  try {
    const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
    const { ref, set } = await import('firebase/database')
    const db = getFirebaseDb()
    await set(ref(db, `participants/${data.uid}`), {
      name: data.name,
      telegram: data.telegram || null,
      sessionId,
      ts: Date.now(),
    })
  } catch (e) {
    console.warn('Registration write failed (non-critical):', e)
  }
}

// --- Styles (CSS module via style tag — no external dep) ---
const css = `
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0f1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.vote-page { min-height: 100dvh; padding: 16px; max-width: 428px; margin: 0 auto; }
.header { padding: 12px 0 20px; border-bottom: 1px solid #1e293b; margin-bottom: 20px; }
.header h1 { font-size: 1.1rem; font-weight: 700; color: #00e5ff; letter-spacing: 0.05em; text-transform: uppercase; }
.session-info { margin-top: 8px; }
.session-title { font-size: 1rem; font-weight: 600; color: #f1f5f9; line-height: 1.3; }
.session-meta { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; }
.connection-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.dot-connected { background: #22c55e; }
.dot-reconnecting { background: #f59e0b; }
.dot-offline { background: #ef4444; }
.dot-frozen { background: #8b5cf6; }
.freeze-banner { background: #1e1b4b; border: 1px solid #4f46e5; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; text-align: center; color: #a5b4fc; font-size: 0.9rem; }
.tags-grid { display: flex; flex-direction: column; gap: 12px; }
.tag-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; transition: border-color 0.2s; }
.tag-card.voted { border-color: #00e5ff44; background: #0d2030; }
.tag-icon { font-size: 1.6rem; line-height: 1; flex-shrink: 0; width: 40px; text-align: center; }
.tag-body { flex: 1; min-width: 0; }
.tag-name { font-size: 0.95rem; font-weight: 600; color: #e2e8f0; }
.tag-count { font-size: 0.8rem; color: #64748b; margin-top: 3px; }
.tag-count.live { color: #00e5ff; }
.vote-btn { min-width: 48px; min-height: 48px; border-radius: 10px; border: none; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, transform 0.1s; }
.vote-btn:active { transform: scale(0.95); }
.vote-btn.idle { background: #00e5ff22; color: #00e5ff; border: 1px solid #00e5ff44; }
.vote-btn.idle:hover { background: #00e5ff33; }
.vote-btn.done { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; cursor: default; }
.vote-btn.pending { background: #1e293b; color: #475569; border: 1px solid #1e293b; cursor: wait; }
.toast-container { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 999; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
.toast { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 18px; font-size: 0.85rem; color: #e2e8f0; white-space: nowrap; animation: slide-up 0.3s ease; max-width: 90vw; text-align: center; }
.toast.error { border-color: #ef444466; color: #fca5a5; }
.toast.success { border-color: #22c55e66; color: #86efac; }
.toast.warn { border-color: #f59e0b66; color: #fcd34d; }
@keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.loading { text-align: center; color: #475569; padding: 40px 0; }
.reg-screen { display: flex; flex-direction: column; gap: 24px; padding: 8px 0 32px; }
.reg-title { font-size: 1.3rem; font-weight: 800; color: #f1f5f9; }
.reg-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 4px; line-height: 1.4; }
.reg-field { display: flex; flex-direction: column; gap: 8px; }
.reg-label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.reg-input { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 16px; color: #f1f5f9; font-size: 1rem; outline: none; transition: border-color 0.2s; }
.reg-input:focus { border-color: #00e5ff66; }
.reg-input::placeholder { color: #475569; }
.reg-hint { font-size: 0.75rem; color: #475569; }
.reg-btn { background: #00e5ff; color: #000; font-size: 1rem; font-weight: 700; border: none; border-radius: 14px; padding: 16px; cursor: pointer; transition: opacity 0.15s, transform 0.1s; }
.reg-btn:active { transform: scale(0.98); opacity: 0.9; }
.reg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.reg-greeting { background: #0f172a; border: 1px solid #00e5ff22; border-radius: 12px; padding: 12px 16px; font-size: 0.9rem; color: #94a3b8; }
.reg-greeting strong { color: #00e5ff; }
`

// --- Toast ---
interface Toast { id: number; msg: string; type: 'success' | 'error' | 'warn' }

let toastId = 0

// --- Main Component ---
export default function VotePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [tags, setTags] = useState<TagCard[]>(DEFAULT_TAGS)
  const [votedTags, setVotedTags] = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Set<string>>(new Set())
  const [frozen, setFrozen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const connection = useConnectionStatus()

  // Registration
  const [participant, setParticipant] = useState<ParticipantData | null>(null)
  const [showReg, setShowReg] = useState(false)
  const [regName, setRegName] = useState('')
  const [regTelegram, setRegTelegram] = useState('')
  const [regSubmitting, setRegSubmitting] = useState(false)

  function showToast(msg: string, type: Toast['type'] = 'warn') {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }

  // Init: anonymous auth + load active session
  useEffect(() => {
    // Check existing registration
    const existing = loadRegistration()
    if (existing) setParticipant(existing)
    else setShowReg(true)
  }, [])

  async function handleRegSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = regName.trim()
    if (!name) return
    setRegSubmitting(true)
    try {
      const uid = userId ?? `anon-${Date.now()}`
      const telegram = regTelegram.trim().replace(/^@/, '')
      const data: ParticipantData = { name, telegram, uid }
      saveRegistration(data)
      setParticipant(data)
      setShowReg(false)
      if (session) await registerParticipant({ ...data, uid: userId ?? uid }, session.id)
    } finally {
      setRegSubmitting(false)
    }
  }

  useEffect(() => {
    async function init() {
      if (!hasFirebaseConfig()) {
        setUserId('mock-user')
        setSession({
          id: 'session-1',
          title: 'Будущее городов в новой реальности',
          speakerName: 'А. Иванова',
          hall: 'Главный зал',
        })
        return
      }

      try {
        const uid = await ensureAnonymousAuth()
        setUserId(uid)

        const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
        const { ref, get, onValue } = await import('firebase/database')
        const db = getFirebaseDb()

        // Load frozen state
        onValue(ref(db, 'event/frozen'), (snap) => {
          setFrozen(!!snap.val())
        })

        // Load active session
        const eventSnap = await get(ref(db, 'event'))
        const eventData = eventSnap.val() as { activeSessionId?: string; frozen?: boolean } | null
        if (!eventData?.activeSessionId) return

        const sessionId = eventData.activeSessionId
        const [sessSnap, votesSnap] = await Promise.all([
          get(ref(db, `sessions/${sessionId}`)),
          get(ref(db, `votes/${sessionId}`)),
        ])

        const sessData = sessSnap.val() as { title: string; speakerId: string; hall: string } | null
        if (!sessData) return

        let speakerName = ''
        try {
          const spSnap = await get(ref(db, `speakers/${sessData.speakerId}`))
          speakerName = (spSnap.val() as { name?: string } | null)?.name ?? ''
        } catch {}

        setSession({ id: sessionId, title: sessData.title, speakerName, hall: sessData.hall })

        // Register participant in Firebase if already registered locally
        const existing = loadRegistration()
        if (existing && uid) {
          registerParticipant({ ...existing, uid }, sessionId)
        }

        // Load vote counts + voted state
        const votesData = (votesSnap.val() as Record<string, number> | null) ?? {}
        setTags((prev) => prev.map((t) => ({ ...t, votes: votesData[t.id] ?? 0 })))

        // Restore voted state from localStorage
        const alreadyVoted = new Set<string>()
        tags.forEach((t) => {
          if (localStorage.getItem(`pulse_voted_${sessionId}_${t.id}_${uid}`) === '1') {
            alreadyVoted.add(t.id)
          }
        })
        setVotedTags(alreadyVoted)

        // Live vote count updates
        onValue(ref(db, `votes/${sessionId}`), (snap) => {
          const counts = (snap.val() as Record<string, number> | null) ?? {}
          setTags((prev) => prev.map((t) => ({ ...t, votes: counts[t.id] ?? t.votes })))
        })

        // Flush offline queue on reconnect
        flushOfflineQueue()
      } catch (err) {
        console.error('Vote page init error:', err)
        showToast('Ошибка подключения', 'error')
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVote = useCallback(
    async (tagId: string) => {
      if (!userId || !session) return
      if (votedTags.has(tagId)) {
        showToast('Вы уже голосовали за этот тег', 'warn')
        return
      }
      if (frozen) {
        showToast('Голосование приостановлено', 'warn')
        return
      }
      if (pendingTags.has(tagId)) return

      setPendingTags((prev) => new Set(prev).add(tagId))

      const result: VoteResult = await voteForTag({
        sessionId: session.id,
        tagId,
        userId,
      })

      setPendingTags((prev) => {
        const next = new Set(prev)
        next.delete(tagId)
        return next
      })

      if (result.ok) {
        setVotedTags((prev) => new Set(prev).add(tagId))
        setTags((prev) => prev.map((t) => t.id === tagId ? { ...t, votes: t.votes + 1 } : t))
        showToast('Голос принят!', 'success')
      } else if (result.status === 'duplicate') {
        setVotedTags((prev) => new Set(prev).add(tagId))
        showToast('Вы уже голосовали за этот тег', 'warn')
      } else if (result.status === 'offline') {
        showToast('Голос сохранён, отправится при подключении', 'warn')
        if (result.queued) setVotedTags((prev) => new Set(prev).add(tagId))
      } else if (result.status === 'rate_limited') {
        showToast(`Подождите ${result.retryAfter} сек`, 'warn')
      } else if (result.status === 'frozen') {
        setFrozen(true)
        showToast('Голосование приостановлено', 'warn')
      } else if (result.status === 'error') {
        showToast('Ошибка отправки', 'error')
      }
    },
    [userId, session, votedTags, pendingTags, frozen]
  )

  const dotClass = connection.status === 'connected' ? 'dot-connected'
    : connection.status === 'offline' ? 'dot-offline'
    : connection.status === 'frozen' ? 'dot-frozen'
    : 'dot-reconnecting'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vote-page">
        {/* Header */}
        <div className="header">
          <h1>
            <span className={`connection-dot ${dotClass}`} />
            AI-Пульс — Голосование
          </h1>
          {session && (
            <div className="session-info">
              <div className="session-title">{session.title}</div>
              <div className="session-meta">
                {session.speakerName && `${session.speakerName} · `}{session.hall}
              </div>
            </div>
          )}
        </div>

        {/* Freeze banner */}
        {frozen && (
          <div className="freeze-banner">
            🔒 Голосование приостановлено
          </div>
        )}

        {/* Registration screen */}
        {showReg && (
          <form className="reg-screen" onSubmit={handleRegSubmit}>
            <div>
              <div className="reg-title">Добро пожаловать 👋</div>
              <div className="reg-subtitle">Введите имя чтобы голосовать и участвовать в аналитике конференции</div>
            </div>
            <div className="reg-field">
              <label className="reg-label">Ваше имя *</label>
              <input
                className="reg-input"
                type="text"
                placeholder="Иван Петров"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                autoFocus
                required
                maxLength={60}
              />
            </div>
            <div className="reg-field">
              <label className="reg-label">Telegram <span style={{fontWeight:400, textTransform:'none', letterSpacing:0}}>— необязательно</span></label>
              <input
                className="reg-input"
                type="text"
                placeholder="@username"
                value={regTelegram}
                onChange={e => setRegTelegram(e.target.value)}
                maxLength={40}
              />
              <div className="reg-hint">Для связи после конференции</div>
            </div>
            <button className="reg-btn" type="submit" disabled={!regName.trim() || regSubmitting}>
              {regSubmitting ? 'Сохраняем...' : 'Войти и голосовать →'}
            </button>
          </form>
        )}

        {/* Greeting bar for registered users */}
        {!showReg && participant && (
          <div className="reg-greeting" style={{marginBottom: 16}}>
            👤 <strong>{participant.name}</strong>
            {participant.telegram && <span style={{color:'#64748b'}}> · @{participant.telegram}</span>}
            <span
              style={{float:'right', color:'#475569', fontSize:'0.8rem', cursor:'pointer'}}
              onClick={() => { setShowReg(true) }}
            >изменить</span>
          </div>
        )}

        {/* Tags */}
        {showReg ? null : !userId ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <div className="tags-grid">
            {tags.map((tag) => {
              const voted = votedTags.has(tag.id)
              const pending = pendingTags.has(tag.id)
              return (
                <div key={tag.id} className={`tag-card${voted ? ' voted' : ''}`}>
                  <div className="tag-icon">{tag.icon}</div>
                  <div className="tag-body">
                    <div className="tag-name">{tag.name}</div>
                    <div className={`tag-count${tag.votes > 0 ? ' live' : ''}`}>
                      {tag.votes > 0 ? `${tag.votes} голосов` : 'Нет голосов'}
                    </div>
                  </div>
                  <button
                    className={`vote-btn ${voted ? 'done' : pending ? 'pending' : 'idle'}`}
                    onClick={() => handleVote(tag.id)}
                    disabled={voted || pending || frozen}
                    aria-label={voted ? 'Голос учтён' : `Голосовать за ${tag.name}`}
                  >
                    {voted ? '✓' : pending ? '…' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Toasts */}
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
          ))}
        </div>
      </div>
    </>
  )
}
