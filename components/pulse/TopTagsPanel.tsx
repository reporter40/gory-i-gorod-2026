'use client'

import type { PulseTopTag } from '@/lib/pulse/pulse-data'

export default function TopTagsPanel({
  topTags,
  filterTabs,
  expanded = false,
}: {
  topTags: PulseTopTag[]
  filterTabs: readonly string[]
  expanded?: boolean
}) {
  return (
    <section className="pulse-panel absolute overflow-hidden px-3 py-2.5" style={{ left: 318, top: 374, width: 994, height: expanded ? 481 : 154 }}>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="pulse-panel-title">Топ-теги сейчас</h2>
          <p className="text-[11px] text-white/42">по вовлечённости</p>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-5 gap-2">
        {topTags.slice(0, 5).map(tag => (
          <div
            key={tag.id}
            className="rounded-[10px] border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-transparent px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[16px]" aria-hidden>
                {tag.icon}
              </span>
              <span className="text-[10px] font-semibold text-green-400">▲ {tag.growth}%</span>
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight text-white">{tag.name}</div>
            <div className="mt-2 text-[18px] font-bold tabular-nums text-white">{tag.votes}</div>
          </div>
        ))}
      </div>
      <div className="no-scroll flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((t, idx) => (
          <button
            key={t}
            type="button"
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
              idx === 0 ? 'border border-cyan-400/55 bg-cyan-500/10 text-white' : 'border border-white/[0.08] text-white/45'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </section>
  )
}
