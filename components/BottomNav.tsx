'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',        label: 'Главная',   svg: <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round"/> },
  { href: '/program', label: 'Программа', svg: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
  { href: '/pulse',   label: 'Пульс',     svg: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/></> },
  { href: '/speakers',label: 'Спикеры',   svg: <><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2" strokeLinecap="round"/></> },
  { href: '/network', label: 'Люди',      svg: <><circle cx="9" cy="7" r="4"/><path d="M3 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75M21 20v-2a4 4 0 00-3-3.87" strokeLinecap="round"/></> },
]

export default function BottomNav() {
  const path = usePathname()
  if (path === '/pulse') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex max-w-lg mx-auto">
        {NAV.map(({ href, label, svg }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                active ? 'text-[#0f1f3d]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                {svg}
              </svg>
              <span className={`text-[10px] font-medium ${active ? 'text-[#0f1f3d]' : ''}`}>{label}</span>
              {active && <span className="absolute bottom-[calc(100%+0px)] w-5 h-0.5 rounded-full bg-[#0f1f3d]" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
