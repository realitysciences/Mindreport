import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://mindreport.ai'),
  title: 'Mind Report',
  description: 'Psychological cartography by ReLoHu™.',
  alternates: {
    canonical: 'https://mindreport.ai',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent theme flash — light is default, dark is opt-in */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('mr-theme-v2');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.background='#161616';}else{document.documentElement.style.background='#F4EDE0';}}catch(e){}})()`
        }} />
        {/* @ts-ignore */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-87JNK4VQ80" />
        <script dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-87JNK4VQ80');`
        }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text-body)' }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {/* Top footer row */}
          <div
            className="px-8 py-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <span
                className="font-bold tracking-widest text-sm uppercase"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', letterSpacing: '0.15em' }}
              >
                Mind Report
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                Psychological cartography by ReLoHu™.
              </p>
            </div>

            {/* Method */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                Method
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                Our approach to psychological cartography.
              </p>
              <a href="/methodology" className="text-xs transition-colors" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                Learn more →
              </a>
            </div>

            {/* About */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                About
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                What Mind Report is and why it exists.
              </p>
              <a href="/about" className="text-xs transition-colors" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                Learn more →
              </a>
            </div>

            {/* Get a map */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                Get Your Map
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                Commission a personal psychological map from ReLoHu™.
              </p>
              <a
                href="https://www.relohu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
              >
                relohu.com →
              </a>
            </div>
          </div>

          {/* Bottom row */}
          <div className="px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            <span>© {new Date().getFullYear()} Mind Report by <a href="https://www.relohu.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>ReLoHu™</a></span>
            <div className="flex flex-wrap items-center gap-5">
              <a href="/methodology" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Methodology</a>
              <a href="/about" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>About</a>
              <a href="/legal" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Editorial Standards</a>
              <a href="/legal" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Privacy</a>
              <a href="/legal" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Terms</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color: 'var(--text-faint)' }} aria-label="X / Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color: 'var(--text-faint)' }} aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70" style={{ color: 'var(--text-faint)' }} aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
