import { Onest } from 'next/font/google'

const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-onest',
  display: 'swap',
})

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return <div className={onest.variable} style={{ minHeight: '100%' }}>{children}</div>
}
