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

const ROLES = [
  { id: 'ceo', label: 'CEO / Основатель', icon: '👔' },
  { id: 'investor', label: 'Инвестор', icon: '💼' },
  { id: 'developer', label: 'Девелопер', icon: '🏗️' },
  { id: 'official', label: 'Чиновник', icon: '🏛️' },
  { id: 'expert', label: 'Эксперт', icon: '🎓' },
  { id: 'other', label: 'Другое', icon: '✨' },
]

const POPULAR_CITIES = ['Москва', 'СПб', 'Казань', 'Сочи', 'Ростов', 'Екб', 'Нск']

interface ParticipantData {
  name: string
  phone: string
  telegram: string
  company: string
  role: string
  city: string
  uid: string
  consent: boolean
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
      phone: data.phone || null,
      telegram: data.telegram || null,
      company: data.company || null,
      role: data.role || null,
      city: data.city || null,
      consent: data.consent,
      sessionId,
      ts: Date.now(),
    })
  } catch (e) {
    console.warn('Registration write failed (non-critical):', e)
  }
}

// --- Inline CSS ---
const css = `
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0f1a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.vote-page { min-height: 100dvh; padding: 16px; max-width: 428px; margin: 0 auto; display: flex; flex-direction: column; }
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

/* ── Wizard ── */
.wizard { display: flex; flex-direction: column; flex: 1; padding-bottom: 32px; }
.wizard-progress { display: flex; gap: 6px; margin-bottom: 32px; }
.wizard-dot { flex: 1; height: 3px; border-radius: 2px; background: #1e293b; transition: background 0.3s; }
.wizard-dot.done { background: #00e5ff; }
.wizard-dot.active { background: #00e5ff88; }
.wizard-step { animation: fade-in 0.25s ease; }
@keyframes fade-in { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
.wizard-emoji { font-size: 2.4rem; margin-bottom: 12px; }
.wizard-title { font-size: 1.4rem; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; }
.wizard-sub { font-size: 0.9rem; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
.reg-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.reg-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.reg-input { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 16px; color: #f1f5f9; font-size: 1rem; outline: none; transition: border-color 0.2s; width: 100%; }
.reg-input:focus { border-color: #00e5ff66; }
.reg-input::placeholder { color: #334155; }
.input-with-prefix { display: flex; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
.input-with-prefix:focus-within { border-color: #00e5ff66; }
.input-prefix { padding: 14px 0 14px 16px; color: #475569; font-size: 1rem; white-space: nowrap; user-select: none; }
.input-with-prefix input { flex: 1; background: transparent; border: none; padding: 14px 16px 14px 6px; color: #f1f5f9; font-size: 1rem; outline: none; }
.reg-hint { font-size: 0.75rem; color: #334155; margin-top: 2px; }
.chip-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.chip { padding: 10px 16px; border-radius: 50px; background: #0f172a; border: 1px solid #1e293b; color: #94a3b8; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; user-select: none; display: flex; align-items: center; gap: 6px; }
.chip:active { transform: scale(0.96); }
.chip.selected { background: #00e5ff18; border-color: #00e5ff66; color: #00e5ff; }
.chip.city { font-size: 0.85rem; padding: 8px 14px; }
.wizard-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn-primary { flex: 1; background: #00e5ff; color: #000; font-size: 1rem; font-weight: 700; border: none; border-radius: 14px; padding: 16px; cursor: pointer; transition: opacity 0.15s, transform 0.1s; }
.btn-primary:active { transform: scale(0.98); opacity: 0.9; }
.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-skip { background: transparent; color: #475569; font-size: 0.9rem; border: 1px solid #1e293b; border-radius: 14px; padding: 16px 20px; cursor: pointer; transition: color 0.15s; white-space: nowrap; }
.btn-skip:hover { color: #94a3b8; }
.btn-back { background: transparent; color: #475569; font-size: 0.9rem; border: none; padding: 0; cursor: pointer; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
.consent-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; font-size: 0.82rem; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
.consent-check { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 4px 0; }
.consent-check input[type=checkbox] { width: 20px; height: 20px; flex-shrink: 0; accent-color: #00e5ff; margin-top: 2px; cursor: pointer; }
.consent-check-label { font-size: 0.88rem; color: #94a3b8; line-height: 1.5; }
.success-screen { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 0 24px; gap: 12px; }
.success-emoji { font-size: 3.5rem; animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
.success-title { font-size: 1.4rem; font-weight: 800; color: #f1f5f9; }
.success-sub { font-size: 0.9rem; color: #64748b; line-height: 1.5; }
.reg-greeting { background: #0f172a; border: 1px solid #00e5ff22; border-radius: 12px; padding: 12px 16px; font-size: 0.9rem; color: #94a3b8; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.reg-greeting strong { color: #00e5ff; }
`

interface Toast { id: number; msg: string; type: 'success' | 'error' | 'warn' }
let toastId = 0

const TOTAL_STEPS = 5

export default function VotePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [tags, setTags] = useState<TagCard[]>(DEFAULT_TAGS)
  const [votedTags, setVotedTags] = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Set<string>>(new Set())
  const [frozen, setFrozen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const connection = useConnectionStatus()

  // Registration wizard
  const [participant, setParticipant] = useState<ParticipantData | null>(null)
  const [showWizard, setShowWizard] = useState<boolean | null>(null) // null = checking
  const [wizardStep, setWizardStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form fields
  const [fName, setFName] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fTelegram, setFTelegram] = useState('')
  const [fCompany, setFCompany] = useState('')
  const [fRole, setFRole] = useState('')
  const [fCity, setFCity] = useState('')
  const [fConsent, setFConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function showToast(msg: string, type: Toast['type'] = 'warn') {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }

  useEffect(() => {
    const existing = loadRegistration()
    if (existing) {
      setParticipant(existing)
      setShowWizard(false)
    } else {
      setShowWizard(true)
    }
  }, [])

  async function finishRegistration() {
    const name = fName.trim()
    if (!name || !fConsent) return
    setSubmitting(true)
    try {
      const uid = userId ?? `anon-${Date.now()}`
      const data: ParticipantData = {
        name,
        phone: fPhone.trim(),
        telegram: fTelegram.trim().replace(/^@/, ''),
        company: fCompany.trim(),
        role: fRole,
        city: fCity.trim(),
        uid,
        consent: true,
      }
      saveRegistration(data)
      setParticipant(data)
      setShowSuccess(true)
      if (session) await registerParticipant({ ...data, uid: userId ?? uid }, session.id)
      setTimeout(() => {
        setShowSuccess(false)
        setShowWizard(false)
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  function nextStep() {
    if (wizardStep < TOTAL_STEPS) setWizardStep(s => s + 1)
    else finishRegistration()
  }

  function prevStep() {
    if (wizardStep > 1) setWizardStep(s => s - 1)
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
        onValue(ref(db, 'event/frozen'), (snap) => setFrozen(!!snap.val()))
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
        const existing = loadRegistration()
        if (existing && uid) registerParticipant({ ...existing, uid }, sessionId)
        const votesData = (votesSnap.val() as Record<string, number> | null) ?? {}
        setTags((prev) => prev.map((t) => ({ ...t, votes: votesData[t.id] ?? 0 })))
        const alreadyVoted = new Set<string>()
        tags.forEach((t) => {
          if (localStorage.getItem(`pulse_voted_${sessionId}_${t.id}_${uid}`) === '1') alreadyVoted.add(t.id)
        })
        setVotedTags(alreadyVoted)
        onValue(ref(db, `votes/${sessionId}`), (snap) => {
          const counts = (snap.val() as Record<string, number> | null) ?? {}
          setTags((prev) => prev.map((t) => ({ ...t, votes: counts[t.id] ?? t.votes })))
        })
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
      if (votedTags.has(tagId)) { showToast('Вы уже голосовали за этот тег', 'warn'); return }
      if (frozen) { showToast('Голосование приостановлено', 'warn'); return }
      if (pendingTags.has(tagId)) return
      setPendingTags((prev) => new Set(prev).add(tagId))
      const result: VoteResult = await voteForTag({ sessionId: session.id, tagId, userId })
      setPendingTags((prev) => { const n = new Set(prev); n.delete(tagId); return n })
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
        setFrozen(true); showToast('Голосование приостановлено', 'warn')
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

  // ── Render wizard step content ──
  function renderStep() {
    if (showSuccess) {
      return (
        <div className="success-screen">
          <div className="success-emoji">🎉</div>
          <div className="success-title">Добро пожаловать!</div>
          <div className="success-sub">Данные сохранены.<br />Голосуйте и участвуйте в аналитике!</div>
        </div>
      )
    }

    const progress = (
      <div className="wizard-progress">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`wizard-dot${i < wizardStep - 1 ? ' done' : i === wizardStep - 1 ? ' active' : ''}`}
          />
        ))}
      </div>
    )

    const backBtn = wizardStep > 1 ? (
      <button className="btn-back" onClick={prevStep}>← Назад</button>
    ) : null

    // Step 1: Name
    if (wizardStep === 1) return (
      <div className="wizard-step">
        {progress}
        <div className="wizard-emoji">👋</div>
        <div className="wizard-title">Как вас зовут?</div>
        <div className="wizard-sub">Имя появится на дашборде конференции</div>
        <div className="reg-field">
          <input
            className="reg-input"
            type="text"
            placeholder="Иван Петров"
            value={fName}
            onChange={e => setFName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fName.trim() && nextStep()}
            autoFocus
            maxLength={60}
          />
        </div>
        <div className="wizard-actions">
          <button className="btn-primary" onClick={nextStep} disabled={!fName.trim()}>
            Далее →
          </button>
        </div>
      </div>
    )

    // Step 2: Role
    if (wizardStep === 2) return (
      <div className="wizard-step">
        {progress}
        {backBtn}
        <div className="wizard-emoji">💼</div>
        <div className="wizard-title">Ваша роль</div>
        <div className="wizard-sub">Помогает нам показывать релевантную аналитику</div>
        <div className="chip-grid">
          {ROLES.map(r => (
            <div
              key={r.id}
              className={`chip${fRole === r.id ? ' selected' : ''}`}
              onClick={() => setFRole(r.id)}
            >
              {r.icon} {r.label}
            </div>
          ))}
        </div>
        <div className="wizard-actions">
          <button className="btn-skip" onClick={() => { setFRole(''); nextStep() }}>Пропустить</button>
          <button className="btn-primary" onClick={nextStep}>
            {fRole ? 'Далее →' : 'Далее →'}
          </button>
        </div>
      </div>
    )

    // Step 3: Company + City
    if (wizardStep === 3) return (
      <div className="wizard-step">
        {progress}
        {backBtn}
        <div className="wizard-emoji">🏙️</div>
        <div className="wizard-title">Откуда вы?</div>
        <div className="wizard-sub">Для карты активности конференции</div>
        <div className="reg-field">
          <label className="reg-label">Город</label>
          <div className="chip-grid" style={{marginBottom: 10}}>
            {POPULAR_CITIES.map(c => (
              <div
                key={c}
                className={`chip city${fCity === c ? ' selected' : ''}`}
                onClick={() => setFCity(fCity === c ? '' : c)}
              >
                {c}
              </div>
            ))}
          </div>
          <input
            className="reg-input"
            type="text"
            placeholder="или введите свой город..."
            value={fCity}
            onChange={e => setFCity(e.target.value)}
            maxLength={40}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Компания <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>— необязательно</span></label>
          <input
            className="reg-input"
            type="text"
            placeholder="ООО Ромашка"
            value={fCompany}
            onChange={e => setFCompany(e.target.value)}
            maxLength={80}
          />
        </div>
        <div className="wizard-actions">
          <button className="btn-skip" onClick={() => { setFCity(''); setFCompany(''); nextStep() }}>Пропустить</button>
          <button className="btn-primary" onClick={nextStep}>Далее →</button>
        </div>
      </div>
    )

    // Step 4: Phone + Telegram
    if (wizardStep === 4) return (
      <div className="wizard-step">
        {progress}
        {backBtn}
        <div className="wizard-emoji">📱</div>
        <div className="wizard-title">Контакты</div>
        <div className="wizard-sub">Для связи после конференции и рассылки материалов</div>
        <div className="reg-field">
          <label className="reg-label">Телефон (WhatsApp) <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>— необязательно</span></label>
          <div className="input-with-prefix">
            <span className="input-prefix">+7</span>
            <input
              type="tel"
              placeholder="900 123 45 67"
              value={fPhone}
              onChange={e => setFPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
            />
          </div>
          <div className="reg-hint">Только цифры после +7</div>
        </div>
        <div className="reg-field">
          <label className="reg-label">Telegram <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>— необязательно</span></label>
          <div className="input-with-prefix">
            <span className="input-prefix">@</span>
            <input
              type="text"
              placeholder="username"
              value={fTelegram}
              onChange={e => setFTelegram(e.target.value.replace(/^@/, ''))}
              maxLength={40}
            />
          </div>
        </div>
        <div className="wizard-actions">
          <button className="btn-skip" onClick={() => { setFPhone(''); setFTelegram(''); nextStep() }}>Пропустить</button>
          <button className="btn-primary" onClick={nextStep}>Далее →</button>
        </div>
      </div>
    )

    // Step 5: Consent + Submit
    if (wizardStep === 5) return (
      <div className="wizard-step">
        {progress}
        {backBtn}
        <div className="wizard-emoji">🔐</div>
        <div className="wizard-title">Последний шаг</div>
        <div className="wizard-sub">Подтвердите согласие для участия</div>
        <div className="consent-box">
          Организатор — ООО «Горы и Город». Ваши данные используются исключительно
          в рамках конференции «Горы и Город — 2026»: для отображения аналитики,
          отправки материалов мероприятия и информации о последующих событиях.
          Данные не передаются третьим лицам. Вы можете отозвать согласие,
          написав на hello@gory-i-gorod.ru
        </div>
        <label className="consent-check">
          <input
            type="checkbox"
            checked={fConsent}
            onChange={e => setFConsent(e.target.checked)}
          />
          <span className="consent-check-label">
            Я согласен(на) на обработку персональных данных и получение
            материалов конференции в соответствии с ФЗ-152
          </span>
        </label>
        <div className="wizard-actions" style={{marginTop: 24}}>
          <button
            className="btn-primary"
            onClick={finishRegistration}
            disabled={!fConsent || submitting}
          >
            {submitting ? 'Сохраняем...' : '✓ Войти и голосовать'}
          </button>
        </div>
      </div>
    )

    return null
  }

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

        {frozen && (
          <div className="freeze-banner">🔒 Голосование приостановлено</div>
        )}

        {/* Wizard */}
        {showWizard === null && <div className="loading">Загрузка...</div>}

        {showWizard === true && (
          <div className="wizard">{renderStep()}</div>
        )}

        {/* Main vote UI */}
        {showWizard === false && !showSuccess && (
          <>
            {participant && (
              <div className="reg-greeting">
                <span>👤</span>
                <span>
                  <strong>{participant.name}</strong>
                  {participant.city && <span style={{color:'#64748b'}}> · {participant.city}</span>}
                  {participant.role && <span style={{color:'#475569'}}> · {ROLES.find(r => r.id === participant.role)?.label}</span>}
                </span>
                <span
                  style={{marginLeft:'auto', color:'#334155', fontSize:'0.8rem', cursor:'pointer'}}
                  onClick={() => { setWizardStep(1); setShowWizard(true) }}
                >изменить</span>
              </div>
            )}

            {!userId ? (
              <div className="loading">Подключение...</div>
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
          </>
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
