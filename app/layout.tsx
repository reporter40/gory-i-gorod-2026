import type { Metadata, Viewport } from 'next'
import { Onest } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import RegistrationGate from '@/components/RegistrationGate'

const onest = Onest({ subsets: ['latin', 'cyrillic'], weight: ['400', '600', '700', '800', '900'], variable: '--font-onest', display: 'swap' })

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
    <html lang="ru" className={`h-full ${onest.variable}`}>
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
