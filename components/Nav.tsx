'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'People', href: '/people' },
  { label: 'Events', href: '/events' },
  { label: 'Relationships', href: '/relationships' },
  { label: 'Works', href: '/works' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-center justify-between px-8 py-4"
      style={{ borderBottom: '0.5px solid #2e2e2e' }}
    >
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.15em] uppercase whitespace-nowrap"
          style={{ color: '#f0ece4' }}
        >
          MIND REPORT
        </Link>
        <a
          href="https://www.relohu.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs whitespace-nowrap transition-colors"
          style={{ color: '#999' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#bbb')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
        >
          by ReLoHu
        </a>
      </div>
      <div className="flex items-center gap-6">
        {navLinks.map(({ label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="text-xs uppercase tracking-widest transition-colors"
              style={{ color: active ? '#f0ece4' : '#bbb', fontFamily: 'var(--font-mono)' }}
            >
              {label}
            </Link>
          )
        })}
        <Link
          href="/search"
          className="text-xs uppercase tracking-widest transition-colors px-3 py-1 rounded"
          style={{
            color: pathname === '/search' ? '#f0ece4' : '#bbb',
            fontFamily: 'var(--font-mono)',
            border: pathname === '/search' ? '0.5px solid #f0ece4' : '0.5px solid #444',
          }}
        >
          Search
        </Link>
      </div>
    </nav>
  )
}
