'use client'

// Prevents browser from sleeping the dashboard tab after 8+ hours.
// Uses Web Locks API + periodic self-ping + auto-reload if frozen.

const PING_INTERVAL_MS = 30_000
const DEAD_THRESHOLD_MS = 60_000

export function startTabKeepAlive(): () => void {
  if (typeof window === 'undefined') return () => {}

  let lastPing = Date.now()
  let pingInterval: ReturnType<typeof setInterval> | null = null
  let lockRelease: (() => void) | null = null
  let stopped = false

  // Web Lock — tells the browser this tab has an active resource lock
  if ('locks' in navigator) {
    navigator.locks.request(
      'pulse-dashboard-keepalive',
      { mode: 'exclusive' },
      () => new Promise<void>((resolve) => {
        lockRelease = resolve
      })
    ).catch(() => {})
  }

  // Periodic self-ping — detects if JS execution is frozen
  pingInterval = setInterval(() => {
    const now = Date.now()
    if (now - lastPing > DEAD_THRESHOLD_MS) {
      // Tab was frozen for >60s → reload
      console.warn('[TabKeepAlive] Execution froze, reloading...')
      window.location.reload()
      return
    }
    lastPing = now
  }, PING_INTERVAL_MS)

  // Hidden 1x1 video element — some browsers throttle tabs without media
  let videoEl: HTMLVideoElement | null = null
  try {
    videoEl = document.createElement('video')
    videoEl.muted = true
    videoEl.loop = true
    videoEl.setAttribute('playsinline', '')
    videoEl.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1'
    // Blank 1-frame video as data URI
    videoEl.src =
      'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0AAAARgYF//9c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzA5NSBiYWVlNDAwIC0gSDI2NC9NUEVHLTQgQVZDIGNvZGVj'
    document.body.appendChild(videoEl)
    videoEl.play().catch(() => {})
  } catch {}

  return function stop() {
    if (stopped) return
    stopped = true
    if (pingInterval) clearInterval(pingInterval)
    if (lockRelease) lockRelease()
    if (videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl)
  }
}

// React hook wrapper
export function useTabKeepAlive(): void {
  if (typeof window === 'undefined') return
  // Module-level singleton — only start once per page
  // Call from app/pulse/page.tsx layout or page
}

// Call this at module level in the dashboard page to activate
let _stopFn: (() => void) | null = null

export function activateTabKeepAlive(): void {
  if (_stopFn) return
  _stopFn = startTabKeepAlive()
}

export function deactivateTabKeepAlive(): void {
  if (_stopFn) { _stopFn(); _stopFn = null }
}
