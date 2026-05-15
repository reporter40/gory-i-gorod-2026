'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      localStorage.removeItem('pulse_participant_v1')
    } catch {}
    router.replace('/')
  }, [router])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#07101f', color: 'rgba(255,255,255,0.4)', fontSize: 14,
    }}>
      Загрузка…
    </div>
  )
}
