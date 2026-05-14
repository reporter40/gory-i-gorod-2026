'use client'
import { useState } from 'react'
import { SPEAKERS, SESSIONS } from '@/lib/data'

const AVATAR_COLORS = ['#0f1f3d', '#166534', '#2563eb', '#9333ea', '#ea580c', '#0891b2']

export default function SpeakersPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = SPEAKERS.filter(sp => {
    if (!q) return true
    return `${sp.name} ${sp.role} ${sp.city}`.toLowerCase().includes(q)
  })

  const openSp = SPEAKERS.find(sp => sp.id === open)
  const openSessions = open ? SESSIONS.filter(s => s.speaker_id === open) : []

  return (
    <div className="min-h-screen">
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead text-white/50 mb-2">Эксперты</p>
          <h1 className="heading text-white">{SPEAKERS.length} спикеров</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Имя, должность или город"
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
        </div>

        <div className="space-y-2">
          {filtered.map((sp, i) => (
            <div key={sp.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {sp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#0f1f3d]">{sp.name}</div>
                <div className="text-xs text-gray-400 line-clamp-2">
                  {sp.role}
                  {sp.city ? ` · ${sp.city}` : ''}
                </div>
              </div>
              <button onClick={() => setOpen(sp.id)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Никого не найдено</div>
          )}
        </div>
      </div>

      {open && openSp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5"
          onClick={() => setOpen(null)}>
          <div className="bg-white rounded-3xl p-6 w-72" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 rounded-full mb-3 flex items-center justify-center text-white text-xl font-bold"
                style={{ background: AVATAR_COLORS[SPEAKERS.indexOf(openSp) % AVATAR_COLORS.length] }}>
                {openSp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h3 className="font-bold text-[#0f1f3d] text-center">{openSp.name}</h3>
              {openSp.role && (
                <p className="text-sm text-gray-500 text-center mt-0.5">{openSp.role}</p>
              )}
              {openSp.city && (
                <p className="text-xs text-gray-400 text-center mt-0.5">📍 {openSp.city}</p>
              )}
            </div>

            {openSessions.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mb-4 space-y-2">
                {openSessions.map(s => (
                  <div key={s.id} className="flex gap-2 text-xs">
                    <span className="text-gray-400 font-mono w-14 flex-shrink-0">
                      {new Date(s.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })} д{s.day}
                    </span>
                    <span className="text-gray-600 leading-relaxed">{s.title}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setOpen(null)} className="text-sm text-gray-400 py-1.5 w-full text-center">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
