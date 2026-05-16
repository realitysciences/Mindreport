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
  { label: 'Maps', href: '/search' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('mr-theme')
    if (saved === 'dark') setTheme('dark')
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('mr-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('mr-theme', 'light')
    }
  }

  return (
    <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div className="flex flex-col leading-none whitespace-nowrap">
          <Link
            href="/"
            className="font-bold tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1rem', letterSpacing: '0.15em' }}
            onClick={() => setOpen(false)}
          >
            Mind Report
          </Link>
          <a
            href="https://www.relohu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-70"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-faint)', letterSpacing: '0.08em', marginTop: '2px' }}
          >
            by ReLoHu™
          </a>
        </div>

        <div className="flex items-center gap-5">
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, href }) => {
              const active = pathname === href || (href !== '/search' && pathname.startsWith(href + '/'))
              return (
                <Link
                  key={href}
                  href={href}
                  className="text-sm transition-colors"
                  style={{ color: active ? 'var(--text-hi)' : 'var(--text-nav)', fontFamily: 'var(--font-sans)', fontWeight: active ? '500' : '400' }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Search */}
          <Link
            href="/search"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors"
            style={{
              color: 'var(--text-mid)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
              background: 'var(--surface-deep)',
            }}
            onClick={() => setOpen(false)}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ color: 'var(--text-faint)' }}>Search maps…</span>
            <kbd className="text-[0.55rem] px-1 rounded" style={{ border: '1px solid var(--border)', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-mid)', background: 'var(--surface-deep)' }}
          >
            {theme === 'light' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
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
        <div className="md:hidden flex flex-col px-8 pb-4 gap-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {navLinks.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="text-sm py-2"
                style={{ color: active ? 'var(--text-hi)' : 'var(--text-nav)', fontWeight: active ? '500' : '400' }}
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
