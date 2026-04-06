import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Mind Report',
  description: 'Psychological cartography by ReLoHu.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('mr-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text-body)' }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer
          className="px-8 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs"
          style={{ borderTop: '0.5px solid var(--border)', color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}
        >
          <span>Mind Report · psychological cartography · <a href="https://www.relohu.com" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-mid)' }}>ReLoHu</a></span>
          <div className="flex items-center gap-6">
            <a href="/legal" className="transition-colors" style={{ color: 'var(--text-faint)' }}>Legal</a>
            <span style={{ color: 'var(--text-faint)' }}>© {new Date().getFullYear()} mindreport.ai</span>
            <a href="https://relohu.com" className="transition-colors" style={{ color: 'var(--text-mid)' }}>relohu.com →</a>
          </div>
        </footer>
      </body>
    </html>
  )
}
