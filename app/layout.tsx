import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import RegistrationGate from '@/components/RegistrationGate'

export const metadata: Metadata = {
  title: 'Горы и Город 2026',
  description: 'Форум урбанистики в Геленджике — 16–17 мая 2026',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ГиГ 2026',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#07101f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: '#07101f' }}>
        <ServiceWorkerRegister />
        <RegistrationGate>
          <main className="flex-1 pb-nav">{children}</main>
          <BottomNav />
        </RegistrationGate>
      </body>
    </html>
  )
}
