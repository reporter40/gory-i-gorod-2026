'use client'

import { useEffect, useState, useRef } from 'react'
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

// ─── Mode definitions ──────────────────────────────────────────────────────
// LIVE    — все работает, данные идут в реальном времени
// FREEZE  — данные заморожены (тихо, зрители не видят изменений, выглядит штатно)
// DEMO    — то же что FREEZE, но ясно что это "показательный" режим
type OperatorMode = 'live' | 'freeze' | 'demo'

const css = `
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body { background: #080d18; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.admin { max-width: 480px; margin: 0 auto; padding: 16px 12px 120px; }
.top-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.top-bar h1 { font-size: 1rem; font-weight: 700; color: #00e5ff; flex: 1; }
.dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; flex-shrink: 0; }
.dot-g { background: #22c55e; box-shadow: 0 0 6px #22c55e88; }
.dot-y { background: #f59e0b; box-shadow: 0 0 6px #f59e0b88; }
.dot-r { background: #ef4444; box-shadow: 0 0 6px #ef444488; }
.dot-off { background: #475569; }
.card { background: #0d1424; border: 1px solid #1e293b; border-radius: 14px; padding: 16px; margin-bottom: 14px; }
.card h2 { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
/* Mode bar */
.mode-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: #080d18; border-top: 1px solid #1e293b; padding: 10px 12px 16px; display: flex; gap: 8px; max-width: 480px; margin: 0 auto; }
.mode-bar-inner { display: flex; gap: 8px; width: 100%; }
.mode-btn { flex: 1; border: none; border-radius: 12px; padding: 14px 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em; min-height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.mode-btn .icon { font-size: 1.3rem; line-height: 1; }
.mode-live { background: #052015; color: #4ade80; border: 1.5px solid #22c55e55; }
.mode-live.active { background: #0a3020; border-color: #22c55e; box-shadow: 0 0 16px #22c55e33; }
.mode-freeze { background: #0d1020; color: #818cf8; border: 1.5px solid #4f46e555; }
.mode-freeze.active { background: #12164a; border-color: #818cf8; box-shadow: 0 0 16px #4f46e533; }
.mode-demo { background: #1a0d00; color: #fb923c; border: 1.5px solid #f97316; opacity: 0; pointer-events: none; }
.mode-demo.visible { opacity: 1; pointer-events: all; }
.mode-demo.active { background: #2a1400; border-color: #fb923c; box-shadow: 0 0 16px #f9731633; }
/* Session rows */
.session-row { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 10px; margin-bottom: 8px; background: #060b14; border: 1px solid #1e293b; }
.session-row.active { border-color: #00e5ff44; background: #0a1a28; }
.session-name { flex: 1; min-width: 0; }
.session-name strong { display: block; font-size: 0.88rem; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-name span { font-size: 0.72rem; color: #475569; }
.badge { font-size: 0.65rem; padding: 3px 8px; border-radius: 20px; font-weight: 700; white-space: nowrap; }
.badge-live { background: #0a2018; color: #4ade80; border: 1px solid #22c55e44; }
.badge-upcoming { background: #1a1508; color: #fbbf24; border: 1px solid #f59e0b44; }
.badge-ended { background: #111; color: #475569; border: 1px solid #33333355; }
/* Buttons */
.btn { border-radius: 10px; border: none; cursor: pointer; font-weight: 600; transition: all 0.15s; }
.btn-sm { padding: 8px 14px; font-size: 0.8rem; min-height: 36px; }
.btn-lg { padding: 14px 20px; font-size: 0.9rem; min-height: 52px; width: 100%; }
.btn-cyan { background: #00e5ff18; color: #00e5ff; border: 1px solid #00e5ff44; }
.btn-cyan:active { background: #00e5ff28; }
.btn-red { background: #7f1d1d; color: #fca5a5; border: 1px solid #ef444455; }
.btn-red:active { background: #991b1b; }
.btn-green { background: #14532d; color: #86efac; border: 1px solid #22c55e44; }
.btn-green:active { background: #166534; }
/* Heartbeat */
.hb-row { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
.hb-age { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
/* Mood */
.mood-item { font-size: 0.78rem; color: #475569; padding: 5px 0; border-bottom: 1px solid #1e293b22; }
/* Wake lock */
.wake-row { display: flex; align-items: center; justify-content: space-between; }
.toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background: #1e293b; border-radius: 24px; transition: 0.2s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #64748b; border-radius: 50%; transition: 0.2s; }
input:checked + .slider { background: #22c55e33; }
input:checked + .slider:before { transform: translateX(20px); background: #22c55e; }
/* Dialog */
.overlay { position: fixed; inset: 0; background: #000000bb; z-index: 200; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 0; }
.sheet { background: #0d1424; border: 1px solid #1e293b; border-radius: 20px 20px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 480px; }
.sheet h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
.sheet p { font-size: 0.88rem; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
.sheet-btns { display: flex; gap: 10px; }
/* Status box */
.status-box { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; }
.status-live { background: #052015; color: #4ade80; border: 1px solid #22c55e33; }
.status-freeze { background: #12164a; color: #818cf8; border: 1px solid #4f46e544; }
.status-demo { background: #2a1400; color: #fb923c; border: 1px solid #f9731633; }
.disabled-msg { text-align: center; padding: 80px 24px; color: #475569; }
`

export default function AdminPage() {
  const connection = useConnectionStatus()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [frozen, setFrozen] = useState(false)
  const [moodFeed, setMoodFeed] = useState<MoodEntry[]>([])
  const [heartbeatAge, setHeartbeatAge] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<'freeze' | 'unfreeze' | null>(null)
  const [wakeLock, setWakeLock] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)
  const [operatorKey, setOperatorKey] = useState('')
  const [operatorMsg, setOperatorMsg] = useState<string | null>(null)

  const mode: OperatorMode = frozen ? 'freeze' : 'live'

  useEffect(() => {
    try {
      const k = sessionStorage.getItem('pulse_operator_key')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved secret once after mount (SSR-safe)
      if (k) setOperatorKey(k)
    } catch {
      /* ignore */
    }
  }, [])

  // Wake lock — keeps phone screen on
  async function toggleWakeLock(on: boolean) {
    if (on) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        setWakeLock(true)
        wakeLockRef.current.addEventListener('release', () => setWakeLock(false))
      } catch { setWakeLock(false) }
    } else {
      await wakeLockRef.current?.release()
      wakeLockRef.current = null
      setWakeLock(false)
    }
  }

  // Auto wake lock on mount
  useEffect(() => {
    queueMicrotask(() => {
      void toggleWakeLock(true)
    })
    return () => { wakeLockRef.current?.release() }
  }, [])

  // Heartbeat age ticker
  useEffect(() => {
    const t = setInterval(() => {
      setHeartbeatAge(a => a !== null ? a + 1 : null)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ADMIN_ENABLED || !hasFirebaseConfig()) {
      queueMicrotask(() => setLoading(false))
      return
    }

    async function setup() {
      try {
        const { getFirebaseDb, ensureAnonymousAuth } = await import('@/lib/pulse/firebase/client')
        const { ref, onValue, orderByChild, limitToLast, query } = await import('firebase/database')
        await ensureAnonymousAuth()
        const db = getFirebaseDb()

        onValue(ref(db, 'sessions'), (snap) => {
          const data = snap.val() as Record<string, Omit<SessionRow, 'id'>> | null
          if (!data) return
          setSessions(Object.entries(data).map(([id, s]) => ({ id, ...s })))
        })
        onValue(ref(db, 'event'), (snap) => {
          const ev = snap.val() as { activeSessionId?: string; frozen?: boolean } | null
          if (!ev) return
          setActiveSessionId(ev.activeSessionId ?? '')
          setFrozen(!!ev.frozen)
        })
        const moodQ = query(ref(db, 'mood'), orderByChild('ts'), limitToLast(10))
        onValue(moodQ, (snap) => {
          const data = snap.val() as Record<string, MoodEntry> | null
          if (!data) return
          setMoodFeed(Object.values(data).sort((a, b) => b.ts - a.ts).slice(0, 10))
        })
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

  async function callOperator(body: Record<string, unknown>): Promise<boolean> {
    setOperatorMsg(null)
    const key = operatorKey.trim()
    if (!key) {
      setOperatorMsg('❌ Введите operator key (секрет сервера)')
      return false
    }
    try {
      const res = await fetch('/api/pulse/operator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pulse-operator-key': key,
        },
        body: JSON.stringify(body),
      })
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !d.ok) {
        setOperatorMsg(`❌ ${d.error ?? res.status}`)
        return false
      }
      return true
    } catch (e) {
      setOperatorMsg(`❌ ${e}`)
      return false
    }
  }

  async function setActiveSession(id: string) {
    await callOperator({ activeSessionId: id })
  }

  async function seedSessions() {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/seed-sessions', { method: 'POST' })
      const d = await res.json() as { ok: boolean; count?: number; error?: string }
      setSeedResult(d.ok ? `✅ Загружено ${d.count} сессий` : `❌ ${d.error}`)
    } catch (e) {
      setSeedResult(`❌ ${e}`)
    } finally {
      setSeeding(false)
    }
  }

  async function resetVotes() {
    if (!confirm('Обнулить все голоса? Это нельзя отменить.')) return
    await callOperator({ resetVotes: true })
  }

  async function applyFrozen(value: boolean) {
    const ok = await callOperator({
      frozen: value,
      mode: value ? 'freeze' : 'live',
    })
    if (ok) setDialog(null)
  }

  if (!ADMIN_ENABLED) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="admin"><div className="disabled-msg"><h2>Admin disabled</h2></div></div>
      </>
    )
  }

  const connDot = connection.status === 'connected' ? 'dot-g'
    : connection.status === 'offline' ? 'dot-r' : 'dot-y'

  const hbDot = heartbeatAge === null ? 'dot-off'
    : heartbeatAge < 15 ? 'dot-g'
    : heartbeatAge < 90 ? 'dot-y' : 'dot-r'

  const hbText = heartbeatAge === null ? 'нет данных'
    : heartbeatAge < 60 ? `${heartbeatAge} сек назад`
    : `${Math.floor(heartbeatAge / 60)} мин назад`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="admin">

        {/* Top bar */}
        <div className="top-bar">
          <h1>⚡ AI-Пульс</h1>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <span className={`dot ${connDot}`} />
            {connection.status === 'connected' ? 'online' : connection.status}
          </span>
        </div>

        {/* Dashboard link */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <a href="/pulse/live" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#0a1a2e', border: '1px solid #00e5ff33', borderRadius: 12,
              padding: '12px 16px', color: '#00e5ff', fontSize: '0.82rem', fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.03em' }}>
            🖥 Дашборд для монитора
          </a>
          <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/pulse/live') }}
            style={{ background: '#0a1a2e', border: '1px solid #1e293b', borderRadius: 12,
              padding: '12px 14px', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>
            📋
          </button>
        </div>

        {/* Operator API key — matches PULSE_OPERATOR_SECRET on server; never commit */}
        <div className="card">
          <h2>Operator API</h2>
          <input
            type="password"
            autoComplete="off"
            placeholder="PULSE_OPERATOR_SECRET"
            value={operatorKey}
            onChange={(e) => {
              const v = e.target.value
              setOperatorKey(v)
              try {
                sessionStorage.setItem('pulse_operator_key', v)
              } catch {
                /* ignore */
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #1e293b',
              background: '#060b14',
              color: '#e2e8f0',
              fontSize: '0.88rem',
              marginBottom: 8,
            }}
          />
          <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.45 }}>
            Запись в <code style={{ color: '#94a3b8' }}>event/*</code> только через сервер. Ключ хранится в sessionStorage
            этого браузера.
          </div>
          {operatorMsg && (
            <div style={{ marginTop: 10, fontSize: '0.82rem', color: operatorMsg.startsWith('❌') ? '#ef4444' : '#4ade80' }}>
              {operatorMsg}
            </div>
          )}
        </div>

        {/* Current mode status */}
        {mode === 'live' && (
          <div className="status-box status-live">
            <span>🟢</span> Режим: LIVE — данные идут в реальном времени
          </div>
        )}
        {mode === 'freeze' && (
          <div className="status-box status-freeze">
            <span>🔵</span> Режим: FREEZE — экран заморожен, зрители ничего не замечают
          </div>
        )}

        {/* Heartbeat */}
        <div className="card">
          <h2>Экран зала</h2>
          <div className="hb-row">
            <span className={`dot ${hbDot}`} />
            <span style={{ color: hbDot === 'dot-g' ? '#4ade80' : hbDot === 'dot-y' ? '#fbbf24' : '#ef4444' }}>
              {hbDot === 'dot-g' ? 'Работает' : hbDot === 'dot-y' ? 'Медленно' : 'Не отвечает'}
            </span>
          </div>
          <div className="hb-age">{hbText}</div>
          {hbDot === 'dot-y' && (
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#f59e0b' }}>
              → Обнови /pulse (F5) на экране зала
            </div>
          )}
          {hbDot === 'dot-r' && (
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#ef4444' }}>
              → Открой /pulse в новой вкладке на проекторе
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="card">
          <h2>Сессии — нажми чтобы сделать LIVE</h2>

          {/* Seed button */}
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-sm btn-cyan" onClick={seedSessions} disabled={seeding}
              style={{ width: '100%', opacity: seeding ? 0.6 : 1 }}>
              {seeding ? '⏳ Загружаю...' : '⬆ Загрузить программу в Firebase'}
            </button>
            {seedResult && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: seedResult.startsWith('✅') ? '#4ade80' : '#ef4444' }}>
                {seedResult}
              </div>
            )}
          </div>

          {/* Reset votes */}
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-sm btn-red" onClick={resetVotes} style={{ width: '100%' }}>
              🗑 Обнулить все голоса
            </button>
          </div>

          {loading && <div style={{ color: '#475569', fontSize: '0.85rem' }}>Загрузка...</div>}
          {!loading && sessions.length === 0 && (
            <div style={{ color: '#475569', fontSize: '0.82rem', padding: '8px 0' }}>
              Нажми кнопку выше чтобы загрузить сессии из программы
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className={`session-row${s.id === activeSessionId ? ' active' : ''}`}
              onClick={() => s.id !== activeSessionId && setActiveSession(s.id)}
              style={{ cursor: s.id !== activeSessionId ? 'pointer' : 'default' }}>
              <div className="session-name">
                <strong>{s.title}</strong>
                <span>{s.hall}</span>
              </div>
              {s.id === activeSessionId
                ? <span className="badge badge-live">● LIVE</span>
                : <span className="badge badge-upcoming">Tap</span>
              }
            </div>
          ))}
        </div>

        {/* Keep awake */}
        <div className="card">
          <h2>Телефон</h2>
          <div className="wake-row">
            <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              {wakeLock ? '🔆 Экран не засыпает' : '💤 Экран может уснуть'}
            </span>
            <label className="toggle">
              <input type="checkbox" checked={wakeLock} onChange={e => toggleWakeLock(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        </div>

        {/* Last votes */}
        <div className="card">
          <h2>Последние голоса</h2>
          {moodFeed.length === 0
            ? <div style={{ color: '#475569', fontSize: '0.82rem' }}>Нет данных</div>
            : moodFeed.map((m, i) => (
              <div key={i} className="mood-item">
                {m.tagId} — {new Date(m.ts).toLocaleTimeString('ru-RU')}
              </div>
            ))
          }
        </div>

        {/* Fallback instructions */}
        <div className="card" style={{ borderColor: '#1e293b' }}>
          <h2>Если всё упало</h2>
          <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7 }}>
            <div>1. F5 на экране → не помогло:</div>
            <div>2. <strong style={{ color: '#818cf8' }}>FREEZE</strong> (кнопка снизу) → зрители ничего не видят</div>
            <div>3. Открыть <code style={{ color: '#fbbf24', background: '#1a1200', padding: '1px 4px', borderRadius: 4 }}>pulse-snapshot-*.html</code> с флешки</div>
            <div>4. Переключить проектор на этот файл</div>
          </div>
        </div>

      </div>

      {/* ─── Bottom mode bar ─── */}
      <div className="mode-bar">
        <div className="mode-bar-inner">
          <button
            className={`mode-btn mode-live${mode === 'live' ? ' active' : ''}`}
            onClick={() => mode !== 'live' && setDialog('unfreeze')}
            disabled={mode === 'live'}
          >
            <span className="icon">▶</span>
            LIVE
          </button>
          <button
            className={`mode-btn mode-freeze${mode === 'freeze' ? ' active' : ''}`}
            onClick={() => mode !== 'freeze' && setDialog('freeze')}
          >
            <span className="icon">⏸</span>
            FREEZE
          </button>
        </div>
      </div>

      {/* Freeze confirmation sheet */}
      {dialog === 'freeze' && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#818cf8' }}>⏸ Заморозить экран?</h3>
            <p>
              Данные на проекторе застынут. Голосование заблокируется.
              Зрители ничего не заметят — экран выглядит штатно.
              Разморозить можно в любой момент кнопкой LIVE.
            </p>
            <div className="sheet-btns">
              <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={() => setDialog(null)}>
                Отмена
              </button>
              <button className="btn btn-sm btn-red" style={{ flex: 1 }} onClick={() => applyFrozen(true)}>
                Заморозить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unfreeze confirmation sheet */}
      {dialog === 'unfreeze' && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#4ade80' }}>▶ Возобновить?</h3>
            <p>
              Данные начнут обновляться в реальном времени.
              Голосование разблокируется.
            </p>
            <div className="sheet-btns">
              <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={() => setDialog(null)}>
                Отмена
              </button>
              <button className="btn btn-sm btn-green" style={{ flex: 1 }} onClick={() => applyFrozen(false)}>
                Включить LIVE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
