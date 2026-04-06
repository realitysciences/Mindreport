import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Mind Report',
  description: 'Psychological cartography by ReLoHu.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: '#161616', color: '#c8c4bc' }}>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer
          className="px-8 py-4 flex items-center justify-between text-xs"
          style={{ borderTop: '0.5px solid #2e2e2e', color: '#888', fontFamily: 'var(--font-mono)' }}
        >
          <span>Mind Report · psychological cartography · <a href="https://www.relohu.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#c8c4bc]" style={{ color: '#888' }}>ReLoHu</a></span>
          <a
            href="https://relohu.com"
            className="transition-colors hover:text-[#c8c4bc]"
            style={{ color: '#888' }}
          >
            relohu.com →
          </a>
        </footer>
      </body>
    </html>
  )
}
