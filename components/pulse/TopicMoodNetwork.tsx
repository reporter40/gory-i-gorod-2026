import type { PulseTopicNode } from '@/lib/pulse/pulse-data'

const LAYOUT: { nodeId: PulseTopicNode['id']; x: number; y: number }[] = [
  { nodeId: 'ppp-dev', x: 152, y: 48 },
  { nodeId: 'innovation', x: 76, y: 122 },
  { nodeId: 'strategy', x: 218, y: 136 },
  { nodeId: 'digital', x: 276, y: 72 },
  { nodeId: 'infra', x: 264, y: 198 },
  { nodeId: 'invest', x: 156, y: 226 },
]

function heatStroke(val: number): string {
  if (val >= 76) return 'rgba(34,197,94,0.95)'
  if (val >= 66) return 'rgba(56,189,248,0.9)'
  if (val >= 58) return 'rgba(234,179,8,0.85)'
  return 'rgba(148,163,184,0.75)'
}

function shortTopicName(name: string): string {
  return name.length > 22 ? `${name.slice(0, 19)}…` : name
}

export default function TopicMoodNetwork({ nodes }: { nodes: PulseTopicNode[] }) {
  const byId = new Map(nodes.map(n => [n.id, n] as const))
  const coords = new Map(LAYOUT.map(l => [l.nodeId, { x: l.x, y: l.y }] as const))
  const edges: [PulseTopicNode['id'], PulseTopicNode['id']][] = [
    ['ppp-dev', 'strategy'],
    ['ppp-dev', 'digital'],
    ['innovation', 'strategy'],
    ['strategy', 'digital'],
    ['digital', 'infra'],
    ['infra', 'invest'],
    ['innovation', 'invest'],
    ['strategy', 'invest'],
    ['invest', 'innovation'],
  ]

  return (
    <section className="pulse-panel absolute overflow-hidden p-3" style={{ left: 1326, top: 76, width: 334, height: 420 }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="pulse-panel-title mb-1">Настроение по темам</h2>
          <p className="text-[11px] text-white/45">карта настроений аудитории</p>
        </div>
      </div>
      <svg width="310" height="300" viewBox="0 0 342 296" className="mx-auto block">
        <defs>
          <filter id="pulseNodeGlow">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {edges.map(([a, b], i) => {
          const pa = coords.get(a)
          const pb = coords.get(b)
          if (!pa || !pb) return null
          return (
            <line
              key={i}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="rgba(0,231,253,0.24)"
              strokeWidth={1.15}
              filter="url(#pulseNodeGlow)"
            />
          )
        })}
        {LAYOUT.map(({ nodeId }) => {
          const n = byId.get(nodeId)
          const p = coords.get(nodeId)
          if (!n || !p) return null
          const bw = Math.min(196, Math.max(120, Math.round((n.value / 100) * 196)))
          const bh = 44
          return (
            <g key={n.id}>
              <rect
                x={p.x - bw / 2}
                y={p.y - bh / 2}
                width={bw}
                height={bh}
                rx={22}
                fill="rgba(6,14,26,0.88)"
                stroke={heatStroke(n.value)}
                strokeWidth={1.2}
                filter="url(#pulseNodeGlow)"
              />
              <text
                x={p.x}
                y={p.y - 4}
                textAnchor="middle"
                fill="#fff"
                fontSize={13}
                fontFamily="system-ui, sans-serif"
                fontWeight={800}
              >
                {`${n.value}%`}
              </text>
              <text
                x={p.x}
                y={p.y + 10}
                textAnchor="middle"
                fill="#22d3ee"
                fontSize={10}
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
              >
                {`▲ ${n.trend}%`}
              </text>
              <text x={p.x} y={p.y + 24} textAnchor="middle" fill="rgba(255,255,255,0.58)" fontSize={10} fontFamily="system-ui, sans-serif">
                {shortTopicName(n.name)}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-white/45">
        <span>Низкий интерес</span>
        <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-slate-600 via-sky-600 to-green-400" />
        <span>Высокий интерес</span>
      </div>
    </section>
  )
}
