'use client'

import { useEffect, useState, useCallback } from 'react'
import { voteForTag, flushOfflineQueue, type VoteResult } from '@/lib/pulse/vote-client'
import { ensureAnonymousAuth, hasFirebaseConfig } from '@/lib/pulse/firebase/client'
import { useConnectionStatus } from '@/lib/pulse/useConnectionStatus'

interface TagCard { id: string; name: string; icon: string; votes: number }
interface SessionInfo { id: string; title: string; speakerName: string; hall: string }

const DEFAULT_TAGS: TagCard[] = [
  { id: 'actual',     name: 'Актуально',         icon: '🔥', votes: 0 },
  { id: 'ppp',        name: 'ГЧП / Партнёрство', icon: '🤝', votes: 0 },
  { id: 'innovation', name: 'Инновации',          icon: '💡', votes: 0 },
  { id: 'cases',      name: 'Кейсы / Практика',  icon: '📋', votes: 0 },
  { id: 'invest',     name: 'Инвестиции',         icon: '💰', votes: 0 },
]

const ROLES = [
  { id: 'ceo',       label: 'CEO / Основатель', icon: '👔' },
  { id: 'investor',  label: 'Инвестор',          icon: '💼' },
  { id: 'developer', label: 'Девелопер',         icon: '🏗️' },
  { id: 'official',  label: 'Чиновник',          icon: '🏛️' },
  { id: 'expert',    label: 'Эксперт',           icon: '🎓' },
  { id: 'other',     label: 'Другое',            icon: '✨' },
]

const POPULAR_CITIES = ['Москва', 'СПб', 'Казань', 'Сочи', 'Ростов', 'Екб', 'Нск', 'Краснодар']

const REGISTRATION_KEY = 'pulse_participant_v1'

interface ParticipantData {
  name: string; phone: string; telegram: string
  company: string; role: string; city: string
  uid: string; consent: boolean
}

function loadRegistration(): ParticipantData | null {
  try { const r = localStorage.getItem(REGISTRATION_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function saveRegistration(d: ParticipantData) {
  try { localStorage.setItem(REGISTRATION_KEY, JSON.stringify(d)) } catch {}
}
async function registerParticipant(data: ParticipantData, sessionId: string) {
  try {
    const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
    const { ref, set } = await import('firebase/database')
    await set(ref(getFirebaseDb(), `participants/${data.uid}`), {
      name: data.name, phone: data.phone || null, telegram: data.telegram || null,
      company: data.company || null, role: data.role || null, city: data.city || null,
      consent: data.consent, sessionId, ts: Date.now(),
    })
  } catch (e) { console.warn('reg write failed:', e) }
}

// ─── PREMIUM CSS ───────────────────────────────────────────────────────────────
const css = `
:root { color-scheme: dark; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #050b18;
  color: #f0f6ff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Page shell ── */
.vp {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse 120% 60% at 50% -10%, #0d2a4a 0%, #050b18 65%);
  position: relative;
  overflow: hidden;
}

/* ambient orb top */
.vp::before {
  content: '';
  position: fixed;
  top: -180px; left: 50%;
  transform: translateX(-50%);
  width: 500px; height: 400px;
  background: radial-gradient(ellipse, rgba(0,180,255,0.12) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ── Header ── */
.vp-header {
  position: relative; z-index: 1;
  padding: 20px 24px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.vp-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: rgba(255,255,255,0.35);
  margin-bottom: 10px;
}
.vp-brand-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #00d4ff;
  box-shadow: 0 0 10px #00d4ff;
}
.vp-forum-name {
  font-size: 1.25rem; font-weight: 800; color: #f0f6ff;
  letter-spacing: -0.02em; line-height: 1.2; margin-top: 4px;
}
.vp-session-title {
  font-size: 1.05rem; font-weight: 600; color: #f0f6ff; line-height: 1.35;
}
.vp-session-meta { font-size: 0.78rem; color: rgba(255,255,255,0.35); margin-top: 4px; }

/* ── Connection dot ── */
.cdot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.cdot-connected   { background: #22d97a; box-shadow: 0 0 8px #22d97a88; }
.cdot-reconnecting{ background: #f59e0b; box-shadow: 0 0 8px #f59e0b88; }
.cdot-offline     { background: #ef4444; box-shadow: 0 0 8px #ef444488; }
.cdot-frozen      { background: #a78bfa; box-shadow: 0 0 8px #a78bfa88; }

/* ── Freeze ── */
.freeze-bar {
  margin: 12px 24px 0;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 12px; padding: 10px 16px;
  color: #a5b4fc; font-size: 0.85rem; text-align: center;
}

/* ── WIZARD ── */
.wizard {
  flex: 1; display: flex; flex-direction: column;
  padding: 0 24px 36px;
  position: relative; z-index: 1;
}

/* thin gradient progress bar — pinned just under header */
.wiz-bar {
  height: 2px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px;
  margin: 20px 0 32px;
  position: relative;
  overflow: hidden;
}
.wiz-bar-fill {
  height: 100%; border-radius: 2px;
  background: linear-gradient(90deg, #00d4ff, #0066ff);
  box-shadow: 0 0 12px #00d4ff88;
  transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
}

/* back button */
.wiz-back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; color: rgba(255,255,255,0.35);
  font-size: 0.85rem; cursor: pointer; padding: 0 0 20px;
  transition: color 0.2s;
}
.wiz-back:hover { color: rgba(255,255,255,0.65); }

/* step container */
.wiz-step { animation: step-in 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both; }
@keyframes step-in {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* emoji */
.wiz-emoji {
  font-size: 3rem; line-height: 1;
  margin-bottom: 16px; display: block;
  filter: drop-shadow(0 4px 20px rgba(0,212,255,0.25));
}

/* heading */
.wiz-title {
  font-size: 2rem; font-weight: 800;
  letter-spacing: -0.03em; line-height: 1.15;
  color: #ffffff; margin-bottom: 8px;
}
.wiz-sub {
  font-size: 0.9rem; color: rgba(255,255,255,0.4);
  line-height: 1.55; margin-bottom: 28px;
}

/* ── Inputs ── */
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.field-label {
  font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}
.field-label span { font-weight: 400; text-transform: none; letter-spacing: 0; }

.glass-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;
  padding: 16px 18px;
  color: #f0f6ff; font-size: 1rem;
  outline: none; width: 100%;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.glass-input:focus {
  border-color: rgba(0,212,255,0.45);
  background: rgba(0,212,255,0.05);
  box-shadow: 0 0 0 3px rgba(0,212,255,0.08), inset 0 0 20px rgba(0,212,255,0.04);
}
.glass-input::placeholder { color: rgba(255,255,255,0.2); }

.prefix-wrap {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px; overflow: hidden;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(12px);
}
.prefix-wrap:focus-within {
  border-color: rgba(0,212,255,0.45);
  background: rgba(0,212,255,0.05);
  box-shadow: 0 0 0 3px rgba(0,212,255,0.08);
}
.prefix-tag {
  padding: 16px 0 16px 18px;
  color: rgba(255,255,255,0.3); font-size: 1rem;
  white-space: nowrap; user-select: none;
}
.prefix-wrap input {
  flex: 1; background: transparent; border: none;
  padding: 16px 18px 16px 6px;
  color: #f0f6ff; font-size: 1rem; outline: none;
}
.prefix-wrap input::placeholder { color: rgba(255,255,255,0.2); }
.field-hint { font-size: 0.72rem; color: rgba(255,255,255,0.22); padding-left: 2px; }

/* ── Role chips (2-col grid) ── */
.role-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px; margin-bottom: 28px;
}
.role-chip {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 16px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: all 0.18s cubic-bezier(0.25,0.46,0.45,0.94);
  user-select: none;
  backdrop-filter: blur(8px);
}
.role-chip:active { transform: scale(0.96); }
.role-chip.sel {
  background: rgba(0,212,255,0.1);
  border-color: rgba(0,212,255,0.4);
  box-shadow: 0 0 20px rgba(0,212,255,0.12), inset 0 0 20px rgba(0,212,255,0.04);
}
.role-chip-icon { font-size: 1.6rem; line-height: 1; }
.role-chip-label {
  font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.6);
  text-align: center; line-height: 1.3;
}
.role-chip.sel .role-chip-label { color: #00d4ff; }

/* ── City chips (horizontal scroll) ── */
.city-scroll {
  display: flex; gap: 8px; overflow-x: auto;
  padding-bottom: 4px; margin-bottom: 14px;
  scrollbar-width: none;
}
.city-scroll::-webkit-scrollbar { display: none; }
.city-chip {
  flex-shrink: 0;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 50px; padding: 9px 16px;
  font-size: 0.85rem; color: rgba(255,255,255,0.5);
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s; user-select: none;
}
.city-chip:active { transform: scale(0.96); }
.city-chip.sel {
  background: rgba(0,212,255,0.1);
  border-color: rgba(0,212,255,0.4);
  color: #00d4ff;
}

/* ── Consent ── */
.consent-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px; padding: 18px;
  font-size: 0.8rem; color: rgba(255,255,255,0.35);
  line-height: 1.65; margin-bottom: 22px;
}
.consent-row {
  display: flex; align-items: flex-start; gap: 14px;
  cursor: pointer; padding: 4px 0;
}
.consent-row input[type=checkbox] {
  width: 22px; height: 22px; flex-shrink: 0;
  accent-color: #00d4ff; margin-top: 2px; cursor: pointer;
  border-radius: 6px;
}
.consent-text { font-size: 0.88rem; color: rgba(255,255,255,0.55); line-height: 1.55; }

/* ── Buttons ── */
.wiz-actions { display: flex; gap: 10px; margin-top: 24px; }

.btn-main {
  flex: 1;
  background: linear-gradient(135deg, #00d4ff 0%, #0066ff 100%);
  color: #000; font-size: 1rem; font-weight: 800;
  border: none; border-radius: 18px; padding: 18px;
  cursor: pointer; letter-spacing: -0.01em;
  box-shadow: 0 8px 32px rgba(0,100,255,0.35), 0 2px 8px rgba(0,212,255,0.2);
  transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
  position: relative; overflow: hidden;
}
.btn-main::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
  pointer-events: none;
}
.btn-main:active { transform: scale(0.97); opacity: 0.92; }
.btn-main:disabled {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.25);
  box-shadow: none; cursor: not-allowed;
}

.btn-skip {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
  font-size: 0.9rem; border-radius: 18px;
  padding: 18px 20px; cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.btn-skip:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.55); }

/* ── Success ── */
.success {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; gap: 14px; padding: 40px 24px;
  position: relative; z-index: 1;
}
.success-emoji {
  font-size: 4rem;
  animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  filter: drop-shadow(0 8px 32px rgba(0,212,255,0.4));
}
@keyframes pop { from { transform: scale(0) rotate(-10deg); } to { transform: scale(1) rotate(0deg); } }
.success-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; color: #fff; }
.success-sub { font-size: 0.92rem; color: rgba(255,255,255,0.4); line-height: 1.6; }

/* ── VOTE page ── */
.vote-shell {
  flex: 1; padding: 0 20px 36px;
  position: relative; z-index: 1;
}

/* user chip */
.user-chip {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px; padding: 12px 16px;
  margin: 16px 0;
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #0066ff);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800; color: #000;
  flex-shrink: 0;
}
.user-name { font-size: 0.9rem; font-weight: 600; color: #f0f6ff; }
.user-meta { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 1px; }
.user-edit {
  margin-left: auto; font-size: 0.75rem; color: rgba(255,255,255,0.25);
  cursor: pointer; background: none; border: none; padding: 0;
  transition: color 0.15s;
}
.user-edit:hover { color: rgba(255,255,255,0.5); }

/* vote section title */
.vote-section-title {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgba(255,255,255,0.25);
  margin: 20px 0 12px;
}

/* tag cards */
.tags { display: flex; flex-direction: column; gap: 10px; }
.tag-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px; padding: 16px 16px 16px 18px;
  display: flex; align-items: center; gap: 14px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.tag-card.voted {
  background: rgba(0,212,255,0.05);
  border-color: rgba(0,212,255,0.2);
  box-shadow: 0 0 20px rgba(0,212,255,0.06);
}
.tag-icon { font-size: 1.5rem; flex-shrink: 0; width: 36px; text-align: center; }
.tag-body { flex: 1; min-width: 0; }
.tag-name { font-size: 0.95rem; font-weight: 600; color: #f0f6ff; }
.tag-votes { font-size: 0.78rem; color: rgba(255,255,255,0.28); margin-top: 3px; }
.tag-votes.live { color: #00d4ff; }

/* vote button */
.vote-btn {
  width: 44px; height: 44px; border-radius: 12px;
  border: none; cursor: pointer; font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}
.vote-btn:active { transform: scale(0.92); }
.vote-btn.idle {
  background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.25);
  color: #00d4ff;
}
.vote-btn.idle:hover { background: rgba(0,212,255,0.18); }
.vote-btn.done {
  background: rgba(34,217,122,0.1);
  border: 1px solid rgba(34,217,122,0.3);
  color: #22d97a; cursor: default;
}
.vote-btn.pending {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.25); cursor: wait;
}

/* ── Toasts ── */
.toast-wrap {
  position: fixed; bottom: 28px; left: 50%;
  transform: translateX(-50%); z-index: 999;
  display: flex; flex-direction: column; gap: 8px;
  align-items: center; pointer-events: none;
}
.toast {
  background: rgba(15,23,42,0.92);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border-radius: 14px; padding: 12px 20px;
  font-size: 0.85rem; color: #f0f6ff;
  white-space: nowrap; animation: toast-up 0.3s ease;
  max-width: 88vw; text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.toast.error { border-color: rgba(239,68,68,0.4); color: #fca5a5; }
.toast.success { border-color: rgba(34,217,122,0.4); color: #86efac; }
.toast.warn  { border-color: rgba(245,158,11,0.4); color: #fcd34d; }
@keyframes toast-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.loading { text-align: center; color: rgba(255,255,255,0.25); padding: 48px 0; font-size: 0.9rem; }
`

interface Toast { id: number; msg: string; type: 'success'|'error'|'warn' }
let toastId = 0
const TOTAL_STEPS = 5

export default function VotePage() {
  const [userId, setUserId]       = useState<string | null>(null)
  const [session, setSession]     = useState<SessionInfo | null>(null)
  const [tags, setTags]           = useState<TagCard[]>(DEFAULT_TAGS)
  const [votedTags, setVotedTags] = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Set<string>>(new Set())
  const [frozen, setFrozen]       = useState(false)
  const [toasts, setToasts]       = useState<Toast[]>([])
  const connection                = useConnectionStatus()

  const [participant, setParticipant] = useState<ParticipantData | null>(null)
  const [showWizard, setShowWizard]   = useState<boolean | null>(null)
  const [wizardStep, setWizardStep]   = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  const [fName, setFName]         = useState('')
  const [fPhone, setFPhone]       = useState('')
  const [fTelegram, setFTelegram] = useState('')
  const [fCompany, setFCompany]   = useState('')
  const [fRole, setFRole]         = useState('')
  const [fCity, setFCity]         = useState('')
  const [fConsent, setFConsent]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function toast(msg: string, type: Toast['type'] = 'warn') {
    const id = ++toastId
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const e = loadRegistration()
    if (e) { setParticipant(e); setShowWizard(false) } else setShowWizard(true)
  }, [])

  async function finishRegistration() {
    const name = fName.trim()
    if (!name || !fConsent) return
    setSubmitting(true)
    try {
      const uid = userId ?? `anon-${Date.now()}`
      const data: ParticipantData = {
        name, phone: fPhone.trim(),
        telegram: fTelegram.trim().replace(/^@/, ''),
        company: fCompany.trim(), role: fRole,
        city: fCity.trim(), uid, consent: true,
      }
      saveRegistration(data)
      setParticipant(data)
      setShowSuccess(true)
      if (session) await registerParticipant({ ...data, uid: userId ?? uid }, session.id)
      setTimeout(() => { setShowSuccess(false); setShowWizard(false) }, 1800)
    } finally { setSubmitting(false) }
  }

  function nextStep() { if (wizardStep < TOTAL_STEPS) setWizardStep(s => s + 1); else finishRegistration() }
  function prevStep() { if (wizardStep > 1) setWizardStep(s => s - 1) }

  useEffect(() => {
    async function init() {
      if (!hasFirebaseConfig()) {
        setUserId('mock-user')
        setSession({ id:'session-1', title:'Будущее городов в новой реальности', speakerName:'А. Иванова', hall:'Главный зал' })
        return
      }
      try {
        const uid = await ensureAnonymousAuth()
        setUserId(uid)
        const { getFirebaseDb } = await import('@/lib/pulse/firebase/client')
        const { ref, get, onValue } = await import('firebase/database')
        const db = getFirebaseDb()
        onValue(ref(db,'event/frozen'), s => setFrozen(!!s.val()))
        const ev = await get(ref(db,'event'))
        const evData = ev.val() as { activeSessionId?:string }|null
        if (!evData?.activeSessionId) return
        const sid = evData.activeSessionId
        const [ss, vs] = await Promise.all([get(ref(db,`sessions/${sid}`)), get(ref(db,`votes/${sid}`))])
        const sd = ss.val() as {title:string;speakerId:string;hall:string}|null
        if (!sd) return
        let spName = ''
        try { const sp = await get(ref(db,`speakers/${sd.speakerId}`)); spName = (sp.val() as {name?:string}|null)?.name??'' } catch {}
        setSession({ id:sid, title:sd.title, speakerName:spName, hall:sd.hall })
        const ex = loadRegistration()
        if (ex && uid) registerParticipant({ ...ex, uid }, sid)
        const vd = (vs.val() as Record<string,number>|null)??{}
        setTags(p => p.map(t => ({ ...t, votes: vd[t.id]??0 })))
        const av = new Set<string>()
        tags.forEach(t => { if (localStorage.getItem(`pulse_voted_${sid}_${t.id}_${uid}`)===`1`) av.add(t.id) })
        setVotedTags(av)
        onValue(ref(db,`votes/${sid}`), s => {
          const c = (s.val() as Record<string,number>|null)??{}
          setTags(p => p.map(t => ({ ...t, votes: c[t.id]??t.votes })))
        })
        flushOfflineQueue()
      } catch(e) { console.error(e); toast('Ошибка подключения','error') }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVote = useCallback(async (tagId: string) => {
    if (!userId || !session) return
    if (votedTags.has(tagId)) { toast('Вы уже голосовали','warn'); return }
    if (frozen) { toast('Голосование приостановлено','warn'); return }
    if (pendingTags.has(tagId)) return
    setPendingTags(p => new Set(p).add(tagId))
    const r: VoteResult = await voteForTag({ sessionId:session.id, tagId, userId })
    setPendingTags(p => { const n=new Set(p); n.delete(tagId); return n })
    if (r.ok) {
      setVotedTags(p => new Set(p).add(tagId))
      setTags(p => p.map(t => t.id===tagId?{...t,votes:t.votes+1}:t))
      toast('Голос принят!','success')
    } else if (r.status==='duplicate') {
      setVotedTags(p => new Set(p).add(tagId)); toast('Уже проголосовали','warn')
    } else if (r.status==='offline') {
      toast('Сохранено, отправится при подключении','warn')
      if (r.queued) setVotedTags(p => new Set(p).add(tagId))
    } else if (r.status==='rate_limited') {
      toast(`Подождите ${r.retryAfter} сек`,'warn')
    } else if (r.status==='frozen') {
      setFrozen(true); toast('Голосование приостановлено','warn')
    } else { toast('Ошибка отправки','error') }
  }, [userId, session, votedTags, pendingTags, frozen])

  const dotCls = connection.status==='connected'?'cdot-connected':connection.status==='offline'?'cdot-offline':connection.status==='frozen'?'cdot-frozen':'cdot-reconnecting'
  const fillPct = `${Math.round((wizardStep / TOTAL_STEPS) * 100)}%`

  const initials = participant?.name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() ?? '?'

  // ── Wizard step content ──
  function renderWizard() {
    if (showSuccess) return (
      <div className="success">
        <span className="success-emoji">🎉</span>
        <div className="success-title">Добро пожаловать!</div>
        <div className="success-sub">Данные сохранены.<br/>Голосуйте и следите за аналитикой!</div>
      </div>
    )

    return (
      <div className="wizard">
        {/* progress bar */}
        <div className="wiz-bar">
          <div className="wiz-bar-fill" style={{ width: fillPct }} />
        </div>

        {/* back */}
        {wizardStep > 1 && (
          <button className="wiz-back" onClick={prevStep}>← Назад</button>
        )}

        {/* step 1 — name */}
        {wizardStep === 1 && (
          <div className="wiz-step" key="s1">
            <span className="wiz-emoji">👋</span>
            <div className="wiz-title">Как вас зовут?</div>
            <div className="wiz-sub">Ваше имя появится на экране конференции</div>
            <div className="field">
              <input className="glass-input" type="text" placeholder="Иван Петров"
                value={fName} onChange={e=>setFName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&fName.trim()&&nextStep()}
                autoFocus maxLength={60} />
            </div>
            <div className="wiz-actions">
              <button className="btn-main" onClick={nextStep} disabled={!fName.trim()}>
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* step 2 — role */}
        {wizardStep === 2 && (
          <div className="wiz-step" key="s2">
            <span className="wiz-emoji">💼</span>
            <div className="wiz-title">Ваша роль</div>
            <div className="wiz-sub">Поможет показать релевантную аналитику</div>
            <div className="role-grid">
              {ROLES.map(r => (
                <div key={r.id} className={`role-chip${fRole===r.id?' sel':''}`}
                  onClick={() => setFRole(fRole===r.id?'':r.id)}>
                  <span className="role-chip-icon">{r.icon}</span>
                  <span className="role-chip-label">{r.label}</span>
                </div>
              ))}
            </div>
            <div className="wiz-actions">
              <button className="btn-skip" onClick={()=>{setFRole('');nextStep()}}>Пропустить</button>
              <button className="btn-main" onClick={nextStep}>Далее →</button>
            </div>
          </div>
        )}

        {/* step 3 — city + company */}
        {wizardStep === 3 && (
          <div className="wiz-step" key="s3">
            <span className="wiz-emoji">🏙️</span>
            <div className="wiz-title">Откуда вы?</div>
            <div className="wiz-sub">Для карты активности конференции</div>
            <div className="field">
              <div className="field-label">Город</div>
              <div className="city-scroll">
                {POPULAR_CITIES.map(c => (
                  <div key={c} className={`city-chip${fCity===c?' sel':''}`}
                    onClick={()=>setFCity(fCity===c?'':c)}>{c}</div>
                ))}
              </div>
              <input className="glass-input" type="text"
                placeholder="или введите свой город..."
                value={fCity} onChange={e=>setFCity(e.target.value)} maxLength={40} />
            </div>
            <div className="field">
              <div className="field-label">Компания <span>— необязательно</span></div>
              <input className="glass-input" type="text" placeholder="ООО «Название»"
                value={fCompany} onChange={e=>setFCompany(e.target.value)} maxLength={80} />
            </div>
            <div className="wiz-actions">
              <button className="btn-skip" onClick={()=>{setFCity('');setFCompany('');nextStep()}}>Пропустить</button>
              <button className="btn-main" onClick={nextStep}>Далее →</button>
            </div>
          </div>
        )}

        {/* step 4 — contacts */}
        {wizardStep === 4 && (
          <div className="wiz-step" key="s4">
            <span className="wiz-emoji">📱</span>
            <div className="wiz-title">Контакты</div>
            <div className="wiz-sub">Для связи и рассылки материалов после конференции</div>
            <div className="field">
              <div className="field-label">Телефон (WhatsApp) <span>— необязательно</span></div>
              <div className="prefix-wrap">
                <span className="prefix-tag">+7</span>
                <input type="tel" placeholder="900 123 45 67"
                  value={fPhone} onChange={e=>setFPhone(e.target.value.replace(/\D/g,'').slice(0,10))} />
              </div>
              <div className="field-hint">Только цифры после +7</div>
            </div>
            <div className="field">
              <div className="field-label">Telegram <span>— необязательно</span></div>
              <div className="prefix-wrap">
                <span className="prefix-tag">@</span>
                <input type="text" placeholder="username"
                  value={fTelegram} onChange={e=>setFTelegram(e.target.value.replace(/^@/,''))} maxLength={40} />
              </div>
            </div>
            <div className="wiz-actions">
              <button className="btn-skip" onClick={()=>{setFPhone('');setFTelegram('');nextStep()}}>Пропустить</button>
              <button className="btn-main" onClick={nextStep}>Далее →</button>
            </div>
          </div>
        )}

        {/* step 5 — consent */}
        {wizardStep === 5 && (
          <div className="wiz-step" key="s5">
            <span className="wiz-emoji">🔐</span>
            <div className="wiz-title">Последний шаг</div>
            <div className="wiz-sub">Подтвердите согласие для участия</div>
            <div className="consent-card">
              Организатор — ООО «Горы и Город». Данные используются исключительно
              в рамках конференции «Горы и Город — 2026»: аналитика, рассылка материалов
              и приглашения на следующие события. Не передаются третьим лицам.
              Отозвать: hello@gory-i-gorod.ru
            </div>
            <label className="consent-row">
              <input type="checkbox" checked={fConsent} onChange={e=>setFConsent(e.target.checked)} />
              <span className="consent-text">
                Согласен(на) на обработку персональных данных и получение
                материалов конференции в соответствии с ФЗ-152
              </span>
            </label>
            <div className="wiz-actions" style={{marginTop:28}}>
              <button className="btn-main" onClick={finishRegistration}
                disabled={!fConsent||submitting}>
                {submitting ? 'Сохраняем...' : '✓ Войти и голосовать'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vp">
        {/* Header */}
        <div className="vp-header">
          <div className="vp-brand">
            <span className={`cdot ${dotCls}`} />
            AI‑Пульс — Голосование
          </div>
          <div className="vp-forum-name">Горы и Город — 2026</div>
          {session && (
            <div className="vp-session-meta" style={{marginTop: 6}}>
              {session.title}{session.speakerName && ` · ${session.speakerName}`}
            </div>
          )}
        </div>

        {frozen && <div className="freeze-bar">🔒 Голосование приостановлено</div>}

        {/* Loading */}
        {showWizard === null && <div className="loading">Загрузка...</div>}

        {/* Wizard */}
        {showWizard === true && renderWizard()}

        {/* Vote UI */}
        {showWizard === false && !showSuccess && (
          <div className="vote-shell">
            {/* user chip */}
            {participant && (
              <div className="user-chip">
                <div className="user-avatar">{initials}</div>
                <div>
                  <div className="user-name">{participant.name}</div>
                  <div className="user-meta">
                    {[participant.city, ROLES.find(r=>r.id===participant.role)?.label].filter(Boolean).join(' · ')||'Участник'}
                  </div>
                </div>
                <button className="user-edit" onClick={()=>{setWizardStep(1);setShowWizard(true)}}>
                  изменить
                </button>
              </div>
            )}

            {!userId ? (
              <div className="loading">Подключение...</div>
            ) : (
              <>
                <div className="vote-section-title">Выберите тему доклада</div>
                <div className="tags">
                  {tags.map(tag => {
                    const voted   = votedTags.has(tag.id)
                    const pending = pendingTags.has(tag.id)
                    return (
                      <div key={tag.id} className={`tag-card${voted?' voted':''}`}>
                        <div className="tag-icon">{tag.icon}</div>
                        <div className="tag-body">
                          <div className="tag-name">{tag.name}</div>
                          <div className={`tag-votes${tag.votes>0?' live':''}`}>
                            {tag.votes>0?`${tag.votes} голосов`:'Нет голосов'}
                          </div>
                        </div>
                        <button
                          className={`vote-btn ${voted?'done':pending?'pending':'idle'}`}
                          onClick={()=>handleVote(tag.id)}
                          disabled={voted||pending||frozen}
                          aria-label={voted?'Голос учтён':`Голосовать за ${tag.name}`}
                        >
                          {voted?'✓':pending?'…':'+'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Toasts */}
        <div className="toast-wrap" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
          ))}
        </div>
      </div>
    </>
  )
}
