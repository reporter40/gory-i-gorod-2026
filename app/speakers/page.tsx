'use client'
import { useState } from 'react'
import { SPEAKERS, SESSIONS } from '@/lib/data'

const AVATAR_COLORS = ['#0f2a4a', '#0a2a1a', '#1a1a4a', '#2a0a3a', '#2a180a', '#0a2a2a']
const AVATAR_TEXT   = ['#4a9eca', '#22c55e', '#818cf8', '#a855f7', '#f97316', '#06b6d4']

export default function SpeakersPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = SPEAKERS.filter(sp => {
    if (!q) return true
    return `${sp.name} ${sp.role} ${sp.city}`.toLowerCase().includes(q)
  })

  const openSp = SPEAKERS.find(sp => sp.id === open)
  const openIdx = openSp ? SPEAKERS.indexOf(openSp) : 0
  const openSessions = open ? SESSIONS.filter(s => s.speaker_id === open) : []

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead mb-2">Эксперты</p>
          <h1 className="heading text-white">{SPEAKERS.length} спикеров</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Имя, должность или город"
            className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none transition-colors"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }} />
        </div>

        <div className="space-y-2">
          {filtered.map((sp, i) => (
            <div key={sp.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: AVATAR_TEXT[i % AVATAR_TEXT.length] }}>
                {sp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{sp.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {sp.role}{sp.city ? ` · ${sp.city}` : ''}
                </div>
              </div>
              <button onClick={() => setOpen(sp.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-3)', background: 'var(--surface)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>Никого не найдено</div>
          )}
        </div>
      </div>

      {open && openSp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          onClick={() => setOpen(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'linear-gradient(160deg, #0e1e35 0%, #091525 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 28,
              overflow: 'hidden',
            }}>

            {/* Accent top bar */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, ${AVATAR_TEXT[openIdx % AVATAR_TEXT.length]}, transparent)`,
            }} />

            <div style={{ padding: '28px 24px 0' }}>
              {/* Avatar + name row */}
              <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800,
                  background: AVATAR_COLORS[openIdx % AVATAR_COLORS.length],
                  color: AVATAR_TEXT[openIdx % AVATAR_TEXT.length],
                  boxShadow: `0 0 24px ${AVATAR_TEXT[openIdx % AVATAR_TEXT.length]}33`,
                }}>
                  {openSp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontWeight: 800, color: '#ffffff', fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4 }}>
                    {openSp.name}
                  </h3>
                  {openSp.city && (
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {openSp.city}
                    </span>
                  )}
                </div>
              </div>

              {/* Role */}
              {openSp.role && (
                <p style={{
                  fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65,
                  paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)',
                  marginBottom: 20,
                }}>
                  {openSp.role}
                </p>
              )}

              {/* Sessions — title on top, time at bottom */}
              {openSessions.length > 0 && (
                <div className="space-y-3" style={{ marginBottom: 24 }}>
                  {openSessions.map(s => (
                    <div key={s.id} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 16, padding: '14px 16px',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, marginBottom: 10 }}>
                        {s.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span style={{
                          fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                          color: AVATAR_TEXT[openIdx % AVATAR_TEXT.length],
                          background: `${AVATAR_TEXT[openIdx % AVATAR_TEXT.length]}15`,
                          border: `1px solid ${AVATAR_TEXT[openIdx % AVATAR_TEXT.length]}30`,
                          borderRadius: 6, padding: '3px 8px', letterSpacing: '0.04em',
                        }}>
                          {new Date(s.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}день {s.day}
                        </span>
                        {s.hall?.trim() && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.hall}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close button */}
            <button onClick={() => setOpen(null)} style={{
              width: '100%', padding: '14px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'none', color: 'var(--text-3)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.04em',
            }}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
