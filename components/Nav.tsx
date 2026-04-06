'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { label: 'People', href: '/people' },
  { label: 'Events', href: '/events' },
  { label: 'Relationships', href: '/relationships' },
  { label: 'Works', href: '/works' },
  { label: 'Archetypes', href: '/archetypes' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{ borderBottom: '0.5px solid #2e2e2e' }}>
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <Link
            href="/"
            className="text-sm font-bold tracking-[0.15em] uppercase whitespace-nowrap"
            style={{ color: '#f0ece4' }}
            onClick={() => setOpen(false)}
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
        <div className="flex items-center gap-4">
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
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
          </div>
          <Link
            href="/search"
            className="text-xs uppercase tracking-widest transition-colors px-3 py-1 rounded"
            style={{
              color: pathname === '/search' ? '#f0ece4' : '#bbb',
              fontFamily: 'var(--font-mono)',
              border: pathname === '/search' ? '0.5px solid #f0ece4' : '0.5px solid #444',
            }}
            onClick={() => setOpen(false)}
          >
            Search
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center gap-[5px] w-6 h-6"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span
              className="block h-px w-full transition-all"
              style={{ background: '#bbb', transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }}
            />
            <span
              className="block h-px w-full transition-all"
              style={{ background: '#bbb', opacity: open ? 0 : 1 }}
            />
            <span
              className="block h-px w-full transition-all"
              style={{ background: '#bbb', transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="md:hidden flex flex-col px-8 pb-4 gap-4"
          style={{ borderTop: '0.5px solid #2e2e2e' }}
        >
          {navLinks.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="text-xs uppercase tracking-widest py-2"
                style={{ color: active ? '#f0ece4' : '#bbb', fontFamily: 'var(--font-mono)' }}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
