'use client'
import { useState } from 'react'
import { getSessionsWithSpeakers, BLOCK_LABELS } from '@/lib/data'

const BLOCK_COLOR: Record<string, string> = {
  tourism: '#2563eb', quality: '#16a34a', creative: '#9333ea',
  infra: '#ea580c', cases: '#0891b2',
}

export default function ProgramPage() {
  const [day, setDay] = useState(1)
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const sessions = getSessionsWithSpeakers().filter(s => s.day === day)
  const filtered = activeBlock ? sessions.filter(s => s.block === activeBlock) : sessions

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="forum-gradient text-white px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="subhead text-white/50 mb-2">Деловая программа</p>
          <h1 className="heading text-white">Расписание форума</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {/* Day tabs */}
        <div className="flex gap-2">
          {[
            { d: 1, label: '17 сент' },
            { d: 2, label: '18 сент' },
          ].map(({ d, label }) => (
            <button key={d} onClick={() => setDay(d)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                day === d
                  ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}>
              День {d} · {label}
            </button>
          ))}
        </div>

        {/* Block filter */}
        <div className="flex gap-2 no-scroll overflow-x-auto pb-1">
          <button onClick={() => setActiveBlock(null)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              !activeBlock ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            Все
          </button>
          {Object.entries(BLOCK_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setActiveBlock(activeBlock === key ? null : key)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all bg-white text-gray-600 border-gray-200"
              style={activeBlock === key ? { borderColor: BLOCK_COLOR[key], color: BLOCK_COLOR[key], background: BLOCK_COLOR[key] + '10' } : {}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: BLOCK_COLOR[key] }} />
              {label}
            </button>
          ))}
        </div>

        {/* Sessions list */}
        <div className="space-y-2 pb-4">
          {filtered.map(session => (
            <div key={session.id} className="card p-4">
              {/* Time + block */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-mono text-gray-400">
                  {new Date(session.starts_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(session.ends_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{session.hall}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: BLOCK_COLOR[session.block] }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: BLOCK_COLOR[session.block] }} />
                  {BLOCK_LABELS[session.block]}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-[#0f1f3d] leading-snug mb-3">{session.title}</h3>

              {session.description && (
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{session.description}</p>
              )}

              {/* Speaker */}
              <div className="flex items-center gap-2.5 pt-2.5 border-t border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={session.speaker.photo_url} alt={session.speaker.name}
                  className="w-7 h-7 rounded-full object-cover grayscale opacity-80" />
                <div>
                  <div className="text-xs font-semibold text-gray-800">{session.speaker.name}</div>
                  <div className="text-[10px] text-gray-400">{session.speaker.role} · {session.speaker.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
