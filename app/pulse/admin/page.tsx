'use client'

import { useEffect, useState } from 'react'
import { useConnectionStatus } from '@/lib/pulse/useConnectionStatus'
import { hasFirebaseConfig } from '@/lib/pulse/firebase/client'

const ADMIN_ENABLED = process.env.NEXT_PUBLIC_PULSE_ADMIN_ENABLED === 'true'

interface SessionRow {
  id: string
  title: string
  hall: string
  status: 'upcoming' | 'live' | 'ended'
}

interface MoodEntry { tagId: string; ts: number }

const css = `
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0f1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.admin { max-width: 760px; margin: 0 auto; padding: 24px 16px; }
.top-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #1e293b; }
.top-bar h1 { font-size: 1.2rem; font-weight: 700; color: #00e5ff; flex: 1; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
.dot-g { background: #22c55e; }
.dot-y { background: #f59e0b; }
.dot-r { background: #ef4444; }
.section { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.section h2 { font-size: 0.9rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
.session-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; background: #0a0f1a; border: 1px solid #1e293b; }
.session-row.active { border-color: #00e5ff44; background: #0d2030; }
.session-name { flex: 1; min-width: 0; }
.session-name strong { display: block; font-size: 0.9rem; color: #f1f5f9; }
.session-name span { font-size: 0.75rem; color: #64748b; }
.status-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
.badge-live { background: #0f2d1f; color: #4ade80; border: 1px solid #22c55e44; }
.badge-upcoming { background: #1e1b0f; color: #fbbf24; border: 1px solid #f59e0b44; }
.badge-ended { background: #1a1a1a; color: #475569; border: 1px solid #33333344; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.15s; min-height: 36px; }
.btn-cyan { background: #00e5ff22; color: #00e5ff; border: 1px solid #00e5ff44; }
.btn-cyan:hover { background: #00e5ff33; }
.btn-danger { background: #7f1d1d; color: #fca5a5; border: 1px solid #ef444466; }
.btn-danger:hover { background: #991b1b; }
.btn-safe { background: #14532d; color: #86efac; border: 1px solid #22c55e44; }
.btn-safe:hover { background: #166534; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.freeze-section { border-color: #4f46e566; }
.freeze-active { border-color: #ef444466 !important; background: #1f0a0a; }
.mood-list { list-style: none; }
.mood-item { font-size: 0.8rem; color: #64748b; padding: 4px 0; border-bottom: 1px solid #1e293b; }
.mood-item:last-child { border-bottom: none; }
.heartbeat-row { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #94a3b8; }
.stat-row { display: flex; gap: 24px; margin-bottom: 12px; }
.stat { text-align: center; }
.stat .num { font-size: 1.4rem; font-weight: 700; color: #00e5ff; }
.stat .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
.dialog-overlay { position: fixed; inset: 0; background: #00000088; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; }
.dialog { background: #0f172a; border: 1px solid #ef444466; border-radius: 14px; padding: 24px; max-width: 360px; width: 100%; }
.dialog h3 { color: #fca5a5; margin-bottom: 12px; }
.dialog p { font-size: 0.9rem; color: #94a3b8; margin-bottom: 20px; line-height: 1.5; }
.dialog-btns { display: flex; gap: 12px; justify-content: flex-end; }
.disabled-msg { text-align: center; padding: 60px 24px; color: #475569; }
.disabled-msg h2 { font-size: 1.1rem; margin-bottom: 8px; }
`

export default function AdminPage() {
  const connection = useConnectionStatus()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [frozen, setFrozen] = useState(false)
  const [moodFeed, setMoodFeed] = useState<MoodEntry[]>([])
  const [heartbeatAge, setHeartbeatAge] = useState<number | null>(null)
  const [showFreezeDialog, setShowFreezeDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ADMIN_ENABLED || !hasFirebaseConfig()) {
      setLoading(false)
      return
    }

    async function setup() {
      try {
        const { getFirebaseDb, ensureAnonymousAuth } = await import('@/lib/pulse/firebase/client')
        const { ref, onValue, orderByChild, limitToLast, query } = await import('firebase/database')
        await ensureAnonymousAuth()
        const db = getFirebaseDb()

        // Sessions
        onValue(ref(db, 'sessions'), (snap) => {
          const data = snap.val() as Record<string, Omit<SessionRow, 'id'>> | null
          if (!data) return
          setSessions(Object.entries(data).map(([id, s]) => ({ id, ...s })))
        })

        // Active session + frozen
        onValue(ref(db, 'event'), (snap) => {
          const ev = snap.val() as { activeSessionId?: string; frozen?: boolean } | null
          if (!ev) return
          setActiveSessionId(ev.activeSessionId ?? '')
          setFrozen(!!ev.frozen)
        })

        // Mood stream (last 10)
        const moodQ = query(ref(db, 'mood'), orderByChild('ts'), limitToLast(10))
        onValue(moodQ, (snap) => {
          const data = snap.val() as Record<string, MoodEntry> | null
          if (!data) return
          setMoodFeed(Object.values(data).sort((a, b) => b.ts - a.ts).slice(0, 10))
        })

        // Heartbeat (dashboard id = 'main')
        onValue(ref(db, 'heartbeat/main/lastSeen'), (snap) => {
          const ts = snap.val() as number | null
          if (ts) setHeartbeatAge(Math.floor((Date.now() - ts) / 1000))
        })

        setLoading(false)
      } catch (err) {
        console.error('Admin init error:', err)
        setLoading(false)
      }
    }
    setup()
  }, [])

  async function setActiveSession(sessionId: string) {
    try {
      const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
      const { ref, set } = await import('firebase/database')
      const db = getFirebaseDb()
      await set(ref(db, 'event/activeSessionId'), sessionId)
    } catch (err) {
      console.error('setActiveSession error:', err)
    }
  }

  async function setFrozenState(value: boolean) {
    try {
      const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
      const { ref, set } = await import('firebase/database')
      const db = getFirebaseDb()
      await set(ref(db, 'event/frozen'), value)
      setShowFreezeDialog(false)
    } catch (err) {
      console.error('setFrozenState error:', err)
    }
  }

  if (!ADMIN_ENABLED) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="admin">
          <div className="disabled-msg">
            <h2>Admin disabled</h2>
            <p>Set NEXT_PUBLIC_PULSE_ADMIN_ENABLED=true to enable</p>
          </div>
        </div>
      </>
    )
  }

  const dotClass = connection.status === 'connected' ? 'dot-g'
    : connection.status === 'offline' ? 'dot-r' : 'dot-y'

  const heartbeatStatus = heartbeatAge === null ? '—'
    : heartbeatAge < 10 ? `${heartbeatAge}с назад`
    : heartbeatAge < 120 ? `${heartbeatAge}с назад`
    : `${Math.floor(heartbeatAge / 60)} мин назад`

  const heartbeatDot = heartbeatAge === null ? 'dot-y'
    : heartbeatAge < 15 ? 'dot-g'
    : heartbeatAge < 90 ? 'dot-y'
    : 'dot-r'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="admin">
        {/* Top bar */}
        <div className="top-bar">
          <h1>AI-Пульс Администратор</h1>
          <span>
            <span className={`dot ${dotClass}`} />
            {connection.status === 'connected' ? 'Connected' : connection.status}
          </span>
        </div>

        {/* Heartbeat */}
        <div className="section">
          <h2>Dashboard Heartbeat</h2>
          <div className="heartbeat-row">
            <span className={`dot ${heartbeatDot}`} />
            Dashboard alive: {heartbeatStatus}
          </div>
        </div>

        {/* Emergency Freeze */}
        <div className={`section freeze-section${frozen ? ' freeze-active' : ''}`}>
          <h2>Emergency Freeze</h2>
          {frozen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>🔒 Заморожено</span>
              <button className="btn btn-safe" onClick={() => setFrozenState(false)}>
                UNFREEZE
              </button>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowFreezeDialog(true)}>
              🚨 EMERGENCY FREEZE
            </button>
          )}
        </div>

        {/* Sessions */}
        <div className="section">
          <h2>Сессии</h2>
          {loading && <div style={{ color: '#475569', fontSize: '0.85rem' }}>Загрузка...</div>}
          {sessions.map((s) => (
            <div key={s.id} className={`session-row${s.id === activeSessionId ? ' active' : ''}`}>
              <div className="session-name">
                <strong>{s.title}</strong>
                <span>{s.hall}</span>
              </div>
              <span className={`status-badge badge-${s.status}`}>
                {s.status === 'live' ? 'LIVE' : s.status === 'upcoming' ? 'Скоро' : 'Завершена'}
              </span>
              {s.id !== activeSessionId && (
                <button className="btn btn-cyan" onClick={() => setActiveSession(s.id)}>
                  Сделать LIVE
                </button>
              )}
            </div>
          ))}
          {!loading && sessions.length === 0 && (
            <div style={{ color: '#475569', fontSize: '0.85rem' }}>Нет сессий в Firebase</div>
          )}
        </div>

        {/* Mood stream */}
        <div className="section">
          <h2>Последние голоса</h2>
          {moodFeed.length === 0
            ? <div style={{ color: '#475569', fontSize: '0.85rem' }}>Нет данных</div>
            : (
              <ul className="mood-list">
                {moodFeed.map((m, i) => (
                  <li key={i} className="mood-item">
                    {m.tagId} — {new Date(m.ts).toLocaleTimeString('ru-RU')}
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>

      {/* Freeze confirmation dialog */}
      {showFreezeDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>🚨 Emergency Freeze</h3>
            <p>
              Это заморозит дашборд и заблокирует голосование.
              Все числа зафиксируются. Продолжить?
            </p>
            <div className="dialog-btns">
              <button className="btn btn-cyan" onClick={() => setShowFreezeDialog(false)}>
                Отмена
              </button>
              <button className="btn btn-danger" onClick={() => setFrozenState(true)}>
                Заморозить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
