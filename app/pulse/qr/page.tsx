'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

const VOTE_URL = 'https://gory-i-gorod-2026.vercel.app/join'

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #050b18;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.qr-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0,180,255,0.18) 0%, transparent 65%),
    #050b18;
  padding: 32px 24px;
  text-align: center;
  gap: 0;
}

/* top label */
.qr-eyebrow {
  font-size: clamp(0.65rem, 1.5vw, 0.75rem);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin-bottom: 14px;
}

/* forum title */
.qr-title {
  font-size: clamp(1.6rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #ffffff;
  margin-bottom: 6px;
}

/* subtitle */
.qr-sub {
  font-size: clamp(0.85rem, 2vw, 1.1rem);
  color: rgba(255,255,255,0.35);
  margin-bottom: 40px;
  font-weight: 400;
}

/* QR card */
.qr-card {
  background: #ffffff;
  border-radius: clamp(20px, 3vw, 28px);
  padding: clamp(20px, 4vw, 32px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 0 60px rgba(0,180,255,0.2),
    0 0 120px rgba(0,80,255,0.12),
    0 24px 80px rgba(0,0,0,0.6);
  margin-bottom: 32px;
  position: relative;
}

/* glow ring around card */
.qr-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(0,212,255,0.4), rgba(0,80,255,0.3), transparent 60%);
  z-index: -1;
  border-radius: clamp(22px, 3.5vw, 30px);
}

/* CTA */
.qr-cta {
  font-size: clamp(1rem, 3vw, 1.4rem);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

/* URL */
.qr-url {
  font-size: clamp(0.7rem, 1.5vw, 0.85rem);
  color: rgba(0,212,255,0.6);
  letter-spacing: 0.02em;
  margin-bottom: 40px;
}

/* divider */
.qr-divider {
  width: 40px; height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 0 auto 28px;
}

/* organizer */
.qr-organizer {
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  color: rgba(255,255,255,0.2);
  letter-spacing: 0.04em;
}

/* print mode */
@media print {
  body { background: white !important; }
  .qr-page {
    background: white !important;
    min-height: 100vh;
  }
  .qr-eyebrow, .qr-organizer { color: #999 !important; }
  .qr-title { color: #000 !important; }
  .qr-sub, .qr-cta { color: #333 !important; }
  .qr-url { color: #0066cc !important; }
  .qr-card { box-shadow: 0 0 0 1px #e5e7eb !important; }
  .qr-card::before { display: none; }
  .no-print { display: none !important; }
}

/* fullscreen button */
.fs-btn {
  position: fixed;
  top: 16px; right: 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: rgba(255,255,255,0.4);
  font-size: 0.78rem;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
  display: flex; gap: 6px; align-items: center;
}
.fs-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
`

export default function QRPage() {
  const [qrSize, setQrSize] = useState(260)

  useEffect(() => {
    function calc() {
      const s = Math.min(window.innerWidth, window.innerHeight)
      setQrSize(Math.min(280, Math.max(160, s * 0.38)))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <button className="fs-btn no-print" onClick={toggleFS}>
        ⛶ На весь экран
      </button>

      <div className="qr-page">
        <div className="qr-eyebrow">Форум городского развития</div>
        <div className="qr-title">Горы и Город — 2026</div>
        <div className="qr-sub">Геленджик · Май 2026</div>

        <div className="qr-card">
          <QRCode
            value={VOTE_URL}
            size={qrSize}
            bgColor="#ffffff"
            fgColor="#050b18"
            level="M"
          />
        </div>

        <div className="qr-cta">Сканируй → регистрация → приложение</div>
        <div className="qr-url">gory-i-gorod-2026.vercel.app/join</div>

        <div className="qr-divider" />
        <div className="qr-organizer">ООО «Горы и Город» · hello@gory-i-gorod.ru</div>
      </div>
    </>
  )
}
