'use client'

import QRCode from 'react-qr-code'
import { useEventMode } from '@/lib/pulse/useEventMode'

const JOIN_URL = 'https://gory-i-gorod-2026.vercel.app/join'

export default function QROverlay() {
  const mode = useEventMode()
  if (mode !== 'vote') return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(0,20,50,0.97) 0%, rgba(3,8,15,0.99) 100%)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,212,255,0.7)' }}>
          AI‑Пульс · Горы и Город 2026
        </div>
        <div style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Оцените доклады
        </div>
        <div style={{
          padding: 24,
          borderRadius: 24,
          background: '#ffffff',
          boxShadow: '0 0 80px rgba(0,212,255,0.35), 0 0 160px rgba(0,212,255,0.15)',
        }}>
          <QRCode value={JOIN_URL} size={280} />
        </div>
        <div style={{ fontSize: 'clamp(0.9rem,1.8vw,1.4rem)', fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
          Отсканируй QR или перейди по ссылке
        </div>
        <div style={{
          padding: '12px 28px',
          borderRadius: 50,
          background: 'rgba(0,212,255,0.1)',
          border: '1px solid rgba(0,212,255,0.35)',
          fontSize: 'clamp(0.75rem,1.4vw,1rem)',
          fontWeight: 700,
          color: '#00d4ff',
          letterSpacing: '0.04em',
        }}>
          {JOIN_URL}
        </div>
      </div>
    </div>
  )
}
