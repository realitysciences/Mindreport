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
          __html: `(function(){try{var t=localStorage.getItem('mr-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()`
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
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                Psychological cartography by ReLoHu™.
              </p>
            </div>

            {/* Method */}
            <div className="flex flex-col gap-3">
              <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                Method
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                Our approach to psychological cartography.
              </p>
              <a href="/methodology" className="text-xs transition-colors" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                Learn more →
              </a>
            </div>

            {/* About */}
            <div className="flex flex-col gap-3">
              <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                About
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                What Mind Report is and why it exists.
              </p>
              <a href="/about" className="text-xs transition-colors" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                Learn more →
              </a>
            </div>

            {/* Get a map */}
            <div className="flex flex-col gap-3">
              <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                Get Your Map
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>
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
          <div className="px-8 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            <span>© {new Date().getFullYear()} mindreport.ai · <a href="https://www.relohu.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>ReLoHu™</a></span>
            <div className="flex items-center gap-6">
              <a href="/methodology" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Methodology</a>
              <a href="/about" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>About</a>
              <a href="/contact" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Contact</a>
              <a href="/legal" className="transition-colors hover:opacity-70" style={{ color: 'var(--text-faint)' }}>Legal</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
