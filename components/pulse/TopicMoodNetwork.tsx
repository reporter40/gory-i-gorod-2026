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

  const edgeKey = (a: PulseTopicNode['id'], b: PulseTopicNode['id']) => [a, b].sort().join('|')
  const primaryKeys = new Set(edges.map(([a, b]) => edgeKey(a, b)))

  const weakEdgesRaw: [PulseTopicNode['id'], PulseTopicNode['id']][] = [
    ['ppp-dev', 'innovation'],
    ['ppp-dev', 'infra'],
    ['innovation', 'digital'],
    ['strategy', 'infra'],
    ['digital', 'invest'],
    ['digital', 'innovation'],
    ['innovation', 'infra'],
  ]
  const weakEdges = weakEdgesRaw.filter(([a, b]) => !primaryKeys.has(edgeKey(a, b)))

  /** Decorative micro-nodes (fixed coords; does not replace topic layout). */
  const sparks: { x: number; y: number; r: number }[] = [
    { x: 128, y: 86, r: 2.1 },
    { x: 196, y: 98, r: 1.6 },
    { x: 244, y: 72, r: 1.8 },
    { x: 288, y: 118, r: 1.5 },
    { x: 92, y: 168, r: 1.7 },
    { x: 210, y: 178, r: 1.4 },
    { x: 268, y: 154, r: 1.9 },
    { x: 152, y: 200, r: 1.5 },
    { x: 302, y: 208, r: 1.6 },
    { x: 118, y: 52, r: 1.3 },
    { x: 232, y: 58, r: 1.4 },
    { x: 170, y: 92, r: 1.2 },
    { x: 248, y: 132, r: 1.35 },
    { x: 312, y: 96, r: 1.25 },
    { x: 64, y: 132, r: 1.15 },
    { x: 198, y: 210, r: 1.3 },
    { x: 284, y: 188, r: 1.2 },
    { x: 138, y: 164, r: 1.1 },
    { x: 86, y: 78, r: 1.05 },
    { x: 302, y: 44, r: 1.15 },
    { x: 178, y: 58, r: 1.0 },
    { x: 226, y: 92, r: 1.08 },
    { x: 54, y: 156, r: 0.95 },
    { x: 318, y: 172, r: 1.12 },
    { x: 146, y: 88, r: 0.98 },
    { x: 258, y: 118, r: 1.02 },
    { x: 108, y: 196, r: 0.92 },
    { x: 292, y: 86, r: 1.06 },
    { x: 72, y: 98, r: 0.88 },
    { x: 188, y: 168, r: 1.0 },
    { x: 242, y: 52, r: 1.04 },
  ]

  const sparkWeb: [number, number, number, number][] = [
    [128, 86, 170, 92],
    [196, 98, 232, 58],
    [244, 72, 288, 118],
    [92, 168, 118, 52],
    [268, 154, 302, 208],
    [152, 200, 198, 210],
    [64, 132, 76, 122],
    [312, 96, 276, 72],
    [140, 110, 218, 136],
    [88, 140, 156, 226],
    [276, 72, 264, 198],
    [152, 48, 76, 122],
    [218, 136, 264, 198],
    [196, 98, 276, 72],
    [118, 52, 232, 58],
  ]

  /** Ultra-fine filaments (decorative; fixed geometry). */
  const filaments: [number, number, number, number][] = [
    [48, 64, 112, 88],
    [302, 40, 244, 72],
    [180, 36, 152, 48],
    [96, 96, 132, 118],
    [288, 108, 264, 198],
    [72, 188, 118, 168],
    [320, 180, 276, 198],
    [134, 210, 156, 226],
    [220, 54, 218, 136],
    [260, 92, 276, 72],
    [168, 72, 196, 98],
    [88, 52, 128, 86],
    [300, 220, 268, 188],
    [56, 148, 92, 168],
    [290, 140, 264, 154],
    [108, 78, 152, 48],
    [248, 210, 198, 210],
    [184, 164, 218, 136],
    [72, 110, 76, 122],
    [308, 64, 288, 118],
    [142, 132, 152, 200],
    [276, 160, 218, 136],
    [96, 200, 118, 168],
    [284, 48, 302, 96],
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
          <pattern id="pulseTopicMesh" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" r="0.8" fill="rgba(0,231,253,0.2)" />
            <circle cx="14" cy="14" r="0.65" fill="rgba(247,168,25,0.12)" />
            <circle cx="17" cy="6" r="0.55" fill="rgba(255,255,255,0.08)" />
            <circle cx="9" cy="11" r="0.45" fill="rgba(0,231,253,0.1)" />
          </pattern>
          <pattern id="pulseTopicGrid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 11 H22 M11 0 V22" fill="none" stroke="rgba(0,231,253,0.055)" strokeWidth="0.35" />
          </pattern>
          <radialGradient id="pulseTopicMeshFade" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="rgba(0,40,80,0.42)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="pulseNodeGlow">
            <feGaussianBlur stdDeviation="3.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pulseSparkGlow">
            <feGaussianBlur stdDeviation="1.45" result="s" />
            <feMerge>
              <feMergeNode in="s" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="pulse-topic-decor pulse-topic-scene-layer">
          <rect x="0" y="0" width="342" height="296" fill="url(#pulseTopicGrid)" opacity={0.14} />
          <rect x="0" y="0" width="342" height="296" fill="url(#pulseTopicMesh)" opacity={0.24} />
          <rect x="0" y="0" width="342" height="296" fill="url(#pulseTopicMeshFade)" opacity={0.64} />
          {filaments.map(([x1, y1, x2, y2], i) => (
            <line
              key={`f-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 3 === 0 ? 'rgba(247,168,25,0.06)' : 'rgba(0,231,253,0.065)'}
              strokeWidth={0.38}
            />
          ))}
          {weakEdges.map(([a, b], i) => {
            const pa = coords.get(a)
            const pb = coords.get(b)
            if (!pa || !pb) return null
            return (
              <line
                key={`w-${i}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="rgba(0,231,253,0.13)"
                strokeWidth={0.52}
              />
            )
          })}
          {sparkWeb.map(([x1, y1, x2, y2], i) => (
            <line
              key={`sw-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(247,168,25,0.09)"
              strokeWidth={0.42}
            />
          ))}
          {sparks.map((s, i) => (
            <circle
              key={`spark-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="rgba(0,231,253,0.55)"
              stroke="rgba(247,168,25,0.25)"
              strokeWidth={0.35}
              filter="url(#pulseSparkGlow)"
            />
          ))}
        </g>
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
              stroke="rgba(0,231,253,0.32)"
              strokeWidth={1.2}
              filter="url(#pulseNodeGlow)"
            />
          )
        })}
        {LAYOUT.map(({ nodeId }) => {
          const n = byId.get(nodeId)
          const p = coords.get(nodeId)
          if (!n || !p) return null
          const bw = Math.min(196, Math.max(120, Math.round((n.value / 100) * 196)))
          const bh = 58
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
              <text x={p.x} y={p.y - 14} textAnchor="middle" fill="rgba(255,255,255,0.50)" fontSize={9} fontFamily="system-ui, sans-serif">
                {shortTopicName(n.name)}
              </text>
              <text
                x={p.x}
                y={p.y + 2}
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
                y={p.y + 15}
                textAnchor="middle"
                fill="#22d3ee"
                fontSize={9}
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
              >
                {`▲ ${n.trend}%`}
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
