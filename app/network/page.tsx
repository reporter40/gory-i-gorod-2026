'use client'

import { useEffect, useState } from 'react'
import { hasFirebaseConfig, getFirebaseDb, ensureAnonymousAuth } from '@/lib/pulse/firebase/client'

const ROLE_ICONS: Record<string, string> = {
  'CEO / Основатель': '👔',
  'Инвестор': '💼',
  'Девелопер': '🏗️',
  'Чиновник': '🏛️',
  'Эксперт': '🎓',
  'Другое': '✨',
}

const AVATAR_COLORS = [
  { bg: 'rgba(0,212,255,0.12)', text: '#00d4ff', border: 'rgba(0,212,255,0.25)' },
  { bg: 'rgba(34,217,122,0.12)', text: '#22d97a', border: 'rgba(34,217,122,0.25)' },
  { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  { bg: 'rgba(249,115,22,0.12)', text: '#f97316', border: 'rgba(249,115,22,0.25)' },
  { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', border: 'rgba(236,72,153,0.25)' },
  { bg: 'rgba(234,179,8,0.12)', text: '#eab308', border: 'rgba(234,179,8,0.25)' },
]

interface Participant {
  uid: string
  name: string
  role?: string
  company?: string
  city?: string
  telegram?: string
  ts?: number
}

export default function NetworkPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<Participant | null>(null)

  useEffect(() => {
    async function init() {
      if (!hasFirebaseConfig()) {
        // Mock for local dev
        setParticipants([
          { uid: '1', name: 'Иван Петров', role: 'CEO / Основатель', company: 'ГК Ромашка', city: 'Москва', telegram: 'ivanpetrov' },
          { uid: '2', name: 'Анна Соколова', role: 'Инвестор', company: 'Инвест Фонд', city: 'СПб', telegram: 'annasokolova' },
          { uid: '3', name: 'Дмитрий Козлов', role: 'Девелопер', city: 'Краснодар' },
        ])
        setLoading(false)
        return
      }

      await ensureAnonymousAuth()

      const { ref, onValue } = await import('firebase/database')
      const db = getFirebaseDb()
      onValue(ref(db, 'participants'), snap => {
        const val = snap.val() as Record<string, Omit<Participant, 'uid'>> | null
        if (!val) { setParticipants([]); setLoading(false); return }
        const list: Participant[] = Object.entries(val)
          .map(([uid, data]) => ({ uid, ...data }))
          .filter(p => p.name)
          .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
        setParticipants(list)
        setLoading(false)
      })
    }
    init().catch(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = participants.filter(p => {
    if (!q) return true
    return `${p.name} ${p.role ?? ''} ${p.company ?? ''} ${p.city ?? ''}`.toLowerCase().includes(q)
  })

  const colorFor = (idx: number) => AVATAR_COLORS[idx % AVATAR_COLORS.length]
  const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const tgUrl = (tg: string) => `https://t.me/${tg.replace(/^@/, '')}`

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead mb-2">Нетворкинг</p>
          <h1 className="heading text-white">
            Участники {!loading && participants.length > 0 && (
              <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>
                {participants.length}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(238,244,255,0.4)', marginTop: 6 }}>
            Зарегистрированные участники форума
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Имя, компания или город"
            className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>Загрузка участников…</div>
        )}

        {/* Empty state */}
        {!loading && participants.length === 0 && (
          <div className="text-center py-12">
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Пока никого нет</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Участники появятся после регистрации</div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {filtered.map((p, i) => {
            const c = colorFor(i)
            const roleIcon = p.role ? (ROLE_ICONS[p.role] ?? '') : ''
            return (
              <div key={p.uid} className="card p-3.5 flex items-center gap-3" style={{ cursor: 'pointer' }}
                onClick={() => setOpen(p)}>
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {roleIcon && <span style={{ marginRight: 4 }}>{roleIcon}</span>}
                    {[p.role, p.company, p.city].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {p.telegram && (
                  <div style={{ fontSize: 10, color: 'rgba(0,212,255,0.7)', fontWeight: 600, flexShrink: 0, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, padding: '3px 8px' }}>
                    ✈️ TG
                  </div>
                )}
              </div>
            )
          })}
          {!loading && filtered.length === 0 && q && (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Никого не найдено</div>
          )}
        </div>
      </div>

      {/* Participant card modal */}
      {open && (() => {
        const idx = participants.indexOf(open)
        const c = colorFor(idx >= 0 ? idx : 0)
        const roleIcon = open.role ? (ROLE_ICONS[open.role] ?? '') : ''
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)' }}
            onClick={() => setOpen(null)}>
            <div className="participant-card" onClick={e => e.stopPropagation()}>

              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, position: 'relative', zIndex: 2 }}>
                <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.18)' }} />
              </div>

              {/* Hero section — sits on top of glow bg */}
              <div style={{ position: 'relative', padding: '24px 24px 22px', textAlign: 'center', zIndex: 2 }}>
                {/* Forum badge */}
                <div style={{
                  position: 'absolute', top: 16, right: 20,
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                }}>ГиГ 2026</div>

                {/* Avatar squircle */}
                <div style={{
                  width: 88, height: 88, borderRadius: 28, margin: '0 auto 18px',
                  background: `linear-gradient(145deg, ${c.text}28 0%, ${c.text}0a 100%)`,
                  border: `2px solid ${c.text}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, fontWeight: 900, color: c.text,
                  boxShadow: `0 0 0 6px ${c.text}0d, 0 0 48px ${c.text}44`,
                }}>
                  {initials(open.name)}
                </div>

                {/* Name */}
                <div style={{
                  fontSize: 27, fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12,
                }}>
                  {open.name}
                </div>

                {/* Role pill */}
                {open.role && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 99,
                    background: `${c.text}14`,
                    border: `1px solid ${c.text}30`,
                  }}>
                    <span style={{ fontSize: 13 }}>{roleIcon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: c.text, letterSpacing: '0.06em' }}>
                      {open.role.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info block */}
              <div style={{ padding: '4px 20px 20px', position: 'relative', zIndex: 2 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 22, overflow: 'hidden', marginBottom: 14,
                  backdropFilter: 'blur(10px)',
                }}>
                  {open.company && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 18px', borderBottom: (open.city || open.telegram) ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                        <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4h6v4M9 11h.01M12 11h.01M15 11h.01M9 7h.01M12 7h.01M15 7h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Компания</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.01em' }}>«{open.company}»</div>
                      </div>
                    </div>
                  )}
                  {open.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 18px', borderBottom: open.telegram ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                        <circle cx="12" cy="9" r="2.5" stroke="white" strokeWidth="1.5"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Город</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.01em' }}>{open.city}</div>
                      </div>
                    </div>
                  )}
                  {open.telegram && (
                    <a href={tgUrl(open.telegram)} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 18px', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Telegram</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#00d4ff', letterSpacing: '-0.01em' }}>@{open.telegram.replace(/^@/, '')}</div>
                      </div>
                    </a>
                  )}
                </div>

                {/* CTA */}
                {open.telegram && (
                  <a href={tgUrl(open.telegram)} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      width: '100%', padding: '17px', borderRadius: 18,
                      background: 'linear-gradient(135deg, #29b6f6 0%, #1565c0 100%)',
                      color: '#fff', fontSize: 16, fontWeight: 800,
                      textDecoration: 'none', marginBottom: 10,
                      boxShadow: '0 8px 40px rgba(41,182,246,0.35)',
                      letterSpacing: '-0.01em',
                    }}
                    onClick={e => e.stopPropagation()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Написать в Telegram
                  </a>
                )}

                <button onClick={() => setOpen(null)} style={{
                  width: '100%', padding: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, color: 'rgba(255,255,255,0.25)',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        .participant-card {
          width: 100%; max-width: 400px;
          position: relative;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 32px;
          overflow: hidden;
          animation: slideUp 0.35s cubic-bezier(0.34,1.4,0.64,1) both;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06) inset;
          background: url('/card-bg.png') center bottom / cover no-repeat;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
