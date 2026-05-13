'use client'

import Image from 'next/image'

/**
 * Dev-only: semi-transparent reference on top of actual UI for pixel alignment.
 * Never production background. Requires BOTH visualTest=1 and overlay=1.
 */
export default function VisualOverlay({ enabled }: { enabled: boolean }) {
  if (!enabled || process.env.NODE_ENV === 'production') return null

  return (
    <div
      className="pulse-visual-overlay-root absolute inset-0"
      aria-hidden
      style={{ boxSizing: 'border-box' }}
    >
      <div className="pulse-visual-overlay-image absolute inset-0 relative">
        <Image
          src="/reference/pulse-target.png"
          alt=""
          fill
          sizes="1672px"
          priority
          className="object-fill"
          draggable={false}
        />
      </div>
      <div className="pointer-events-none absolute left-2 top-2 z-[10000] max-w-[min(100%,22rem)] rounded border border-amber-400/50 bg-black/80 px-2 py-1 font-mono text-[9px] font-bold uppercase leading-tight tracking-wide text-amber-200 shadow-lg">
        REFERENCE OVERLAY — NOT FINAL UI
      </div>
    </div>
  )
}
