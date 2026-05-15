'use client'
import { useState } from 'react'
import { getSessionsWithSpeakers, BLOCK_LABELS, SPEAKERS } from '@/lib/data'

const BLOCK_COLOR: Record<string, string> = {
  tourism: '#4a9eca', quality: '#22c55e', creative: '#a855f7',
  infra: '#f97316', cases: '#06b6d4',
}

export default function ProgramPage() {
  const [day, setDay] = useState(1)
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const sessions = getSessionsWithSpeakers()
    .filter(s => s.day === day)
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() ||
        a.hall.localeCompare(b.hall, 'ru'),
    )
  const filtered = activeBlock
    ? sessions.filter(s => s.block === activeBlock)
    : sessions

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead mb-2">Деловая программа</p>
          <h1 className="heading text-white">Расписание форума</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {/* Day tabs */}
        <div className="flex gap-2">
          {[
            { d: 1, label: '16 мая' },
            { d: 2, label: '17 мая' },
          ].map(({ d, label }) => (
            <button key={d} onClick={() => setDay(d)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={day === d
                ? { background: 'var(--accent)', color: '#07101f', border: '1px solid transparent' }
                : { background: 'var(--surface)', color: 'rgba(238,244,255,0.35)', border: '1px solid var(--border)' }
              }>
              День {d} · {label}
            </button>
          ))}
        </div>

        {/* Block filter */}
        <div className="flex gap-2 no-scroll overflow-x-auto pb-1">
          <button onClick={() => setActiveBlock(null)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={!activeBlock
              ? { background: 'var(--accent)', color: '#07101f', border: '1px solid transparent' }
              : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }
            }>
            Все
          </button>
          {Object.entries(BLOCK_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setActiveBlock(activeBlock === key ? null : key)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
              style={activeBlock === key
                ? { background: `${BLOCK_COLOR[key]}18`, color: 'rgba(238,244,255,0.75)', border: `1px solid ${BLOCK_COLOR[key]}40` }
                : { background: 'var(--surface)', color: 'rgba(238,244,255,0.35)', border: '1px solid var(--border)' }
              }>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: BLOCK_COLOR[key] }} />
              {label}
            </button>
          ))}
        </div>

        {/* Sessions list */}
        <div className="space-y-4 pb-6">
          {filtered.map(session =>
            session.program_card === 'title_only' ? (
              <div key={session.id} className="card" style={{ padding: '18px 20px' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, fontSize: 15 }}>{session.title}</h3>
              </div>
            ) : (
              <div key={session.id} className="card" style={{ padding: '18px 20px 20px' }}>
                {/* Time + block */}
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                    {new Date(session.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(session.ends_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    {session.hall?.trim() ? ` · ${session.hall}` : ''}
                  </span>
                  <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, color: BLOCK_COLOR[session.block], letterSpacing: '0.03em' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: BLOCK_COLOR[session.block] }} />
                    {BLOCK_LABELS[session.block]}
                  </span>
                </div>

                {session.title?.trim() ? (
                  <h3 style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12, fontSize: 16 }}>
                    {session.title}
                  </h3>
                ) : null}

                {session.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>
                    {session.description}
                  </p>
                )}

                {session.speaker_row_note?.trim() ? (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 -20px -20px', padding: '14px 20px 18px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', borderRadius: '0 0 18px 18px', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                    {session.speaker_row_note}
                  </p>
                ) : session.speaker_id !== 'org' || Boolean(session.title?.trim()) ? (
                  <div className="space-y-2.5" style={{ margin: '0 -20px -20px', padding: '14px 20px 18px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', borderRadius: '0 0 18px 18px' }}>
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={session.speaker.photo_url} alt={session.speaker.name}
                        className="w-7 h-7 rounded-full object-cover"
                        style={{ filter: 'grayscale(60%) brightness(0.85) opacity(0.7)' }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{session.speaker.name}</div>
                        {[session.speaker.role, session.speaker.city].filter(Boolean).length > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                            {[session.speaker.role, session.speaker.city].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {session.extra_speaker_ids?.map(id => {
                      const sp = SPEAKERS.find(x => x.id === id)
                      if (!sp) return null
                      return (
                        <div key={id} className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sp.photo_url} alt={sp.name}
                            className="w-7 h-7 rounded-full object-cover"
                            style={{ filter: 'grayscale(60%) brightness(0.85) opacity(0.7)' }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{sp.name}</div>
                            {[sp.role, sp.city].filter(Boolean).length > 0 && (
                              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                                {[sp.role, sp.city].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
