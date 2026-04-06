'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('mr-theme')
    if (saved === 'light') setTheme('light')
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('mr-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('mr-theme', 'dark')
    }
  }

  return (
    <nav style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <Link
            href="/"
            className="text-sm font-bold tracking-[0.15em] uppercase whitespace-nowrap"
            style={{ color: 'var(--text-hi)' }}
            onClick={() => setOpen(false)}
          >
            MIND REPORT
          </Link>
          <a
            href="https://www.relohu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs whitespace-nowrap transition-colors"
            style={{ color: 'var(--text-mid)' }}
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
                  style={{ color: active ? 'var(--text-hi)' : 'var(--text-nav)', fontFamily: 'var(--font-mono)' }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Search */}
          <Link
            href="/search"
            className="text-xs uppercase tracking-widest transition-colors px-3 py-1 rounded"
            style={{
              color: pathname === '/search' ? 'var(--text-hi)' : 'var(--text-nav)',
              fontFamily: 'var(--font-mono)',
              border: pathname === '/search' ? '0.5px solid var(--text-hi)' : '0.5px solid var(--border)',
            }}
            onClick={() => setOpen(false)}
          >
            Search
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: '30px',
              height: '30px',
              border: '0.5px solid var(--border)',
              color: 'var(--text-mid)',
              background: 'transparent',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {theme === 'dark' ? '○' : '●'}
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center gap-[5px] w-6 h-6"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="block h-px w-full transition-all" style={{ background: 'var(--text-nav)', transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span className="block h-px w-full transition-all" style={{ background: 'var(--text-nav)', opacity: open ? 0 : 1 }} />
            <span className="block h-px w-full transition-all" style={{ background: 'var(--text-nav)', transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden flex flex-col px-8 pb-4 gap-4" style={{ borderTop: '0.5px solid var(--border)', background: 'var(--bg)' }}>
          {navLinks.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="text-xs uppercase tracking-widest py-2"
                style={{ color: active ? 'var(--text-hi)' : 'var(--text-nav)', fontFamily: 'var(--font-mono)' }}
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
