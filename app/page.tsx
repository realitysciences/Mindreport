import Link from 'next/link'
import { getAllMaps } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { MapArticle } from '@/lib/types'

export const dynamic = 'force-dynamic'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function MapCard({ map }: { map: MapArticle }) {
  const color = getCategoryColor(map.category)
  const label = categoryLabels[map.category]
  return (
    <Link
      href={`/${map.category}/${map.slug}`}
      className="flex flex-col justify-between p-6 rounded transition-colors group"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
    >
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span className="text-[0.65rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}>
            {label}
          </span>
        </div>
        <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: 'var(--text-hi)' }}>
          {map.title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-lo)' }}>
          {map.deck}
        </p>
      </div>
      <div className="flex justify-end mt-4">
        <span
          className="text-[0.6rem] uppercase tracking-widest px-2 py-1 rounded"
          style={{ color, border: `0.5px solid ${color}33`, fontFamily: 'var(--font-mono)' }}
        >
          {label} →
        </span>
      </div>
    </Link>
  )
}

function FeaturedCard({ map, primary = false }: { map: MapArticle; primary?: boolean }) {
  const color = getCategoryColor(map.category)
  const label = categoryLabels[map.category]
  return (
    <Link
      href={`/${map.category}/${map.slug}`}
      className="flex flex-col justify-between p-8 rounded h-full transition-colors"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}>
              {label}
            </span>
          </div>
          <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
            {map.fileNumber}
          </span>
        </div>
        <h2
          className="font-bold leading-tight tracking-tight"
          style={{ color: 'var(--text-hi)', fontSize: primary ? '2.5rem' : '1.75rem' }}
        >
          {map.title}
        </h2>
        <p
          className="leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: primary ? '1rem' : '0.875rem' }}
        >
          {map.deck}
        </p>
      </div>
      <div
        className="text-[0.6rem] uppercase tracking-widest mt-6 pt-4"
        style={{ borderTop: '0.5px solid var(--border-sub)', fontFamily: 'var(--font-mono)', color }}
      >
        Read map →
      </div>
    </Link>
  )
}

export default function HomePage() {
  const shuffled = shuffle(getAllMaps())
  const featured1 = shuffled[0]
  const featured2 = shuffled[1]
  const recent = shuffled.slice(2, 5)

  return (
    <div>
      {/* Hero statement */}
      <section className="px-8 pt-14 pb-10" style={{ borderBottom: '0.5px solid var(--border)' }}>
        <h1
          className="font-bold leading-tight tracking-tight mb-5"
          style={{ color: 'var(--text-hi)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', maxWidth: '780px' }}
        >
          Psychological maps of public figures,<br className="hidden sm:block" /> cultural events, and creative works.
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5" style={{ maxWidth: '780px' }}>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-mid)', fontStyle: 'italic', maxWidth: '520px' }}
          >
            Each map reads its subject as terrain: identifying the wound beneath the pattern,
            the architecture beneath the behavior.
          </p>
          <a
            href="https://www.relohu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.65rem] uppercase tracking-widest whitespace-nowrap px-4 py-2 rounded flex-shrink-0 transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)', border: '0.5px solid var(--border)' }}
          >
            Get your own map →
          </a>
        </div>
      </section>

      {/* Hero — two featured maps */}
      <section
        className="px-8 py-8 grid gap-4 items-stretch grid-cols-1 md:grid-cols-[3fr_2fr]"
        style={{ borderBottom: '0.5px solid var(--border)' }}
      >
        <FeaturedCard map={featured1} primary />
        <FeaturedCard map={featured2} />
      </section>

      {/* Recent maps */}
      <section className="px-8 py-12">
        <h2
          className="text-xs uppercase tracking-widest mb-8"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
        >
          Recent maps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recent.map((m) => (
            <MapCard key={m.slug} map={m} />
          ))}
        </div>
      </section>
    </div>
  )
}
