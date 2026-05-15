'use client'

import type { PulseTopTag } from '@/lib/pulse/pulse-data'

export default function TopTagsPanel({
  topTags,
  filterTabs,
}: {
  topTags: PulseTopTag[]
  filterTabs: readonly string[]
}) {
  return (
    <section className="pulse-panel absolute overflow-hidden px-3 pb-3 pt-2.5" style={{ left: 1326, top: 502, width: 334, height: 353 }}>
      <div className="mb-2">
        <h2 className="pulse-panel-title">Топ-теги сейчас</h2>
        <p className="text-[11px] text-white/42">по вовлечённости</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {topTags.slice(0, 5).map(tag => (
          <div
            key={tag.id}
            className="flex items-center gap-3 rounded-[10px] border border-white/[0.22] bg-gradient-to-b from-white/[0.18] to-white/[0.06] px-3 py-1.5 backdrop-blur-sm"
            style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.35)' }}
          >
            <span className="text-[18px] shrink-0" aria-hidden>{tag.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-white">{tag.name}</div>
              <div className={`text-[10px] text-white/45 tabular-nums transition-opacity ${tag.votes > 0 ? 'opacity-100' : 'opacity-0'}`}>{tag.votes || '—'} голосов</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <div className={`text-[15px] font-bold tabular-nums text-white transition-opacity ${tag.votes > 0 ? 'opacity-100' : 'opacity-0'}`}>{tag.votes || '—'}</div>
              <span className={`text-[10px] font-semibold text-green-400 transition-opacity ${tag.growth > 0 ? 'opacity-100' : 'opacity-0'}`}>▲ {tag.growth}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
