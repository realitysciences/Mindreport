import Link from 'next/link'
import { getAllMaps } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { MapArticle } from '@/lib/types'

function TerrainCard({ map, color }: { map: MapArticle; color: string }) {
  return (
    <div
      className="rounded p-5 text-xs flex flex-col gap-3"
      style={{ background: '#111', border: '0.5px solid #2e2e2e' }}
    >
      {[
        { label: 'CORE ORIENTATION', value: map.terrainMap.coreOrientation },
        { label: 'PRIMARY WOUND', value: map.terrainMap.primaryWound },
        { label: 'DOMINANT PATTERN', value: map.terrainMap.dominantPattern },
        { label: 'RELATIONAL STYLE', value: map.terrainMap.relationalStyle },
      ].map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: color }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', color: '#999', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
              {label}
            </span>
          </div>
          <span style={{ color: '#bbb', paddingLeft: '1rem' }}>{value}</span>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: '#999', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
            TERRAIN MARKERS
          </span>
        </div>
        <div className="flex flex-wrap gap-1 pl-4">
          {map.terrainMap.markers.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-[0.6rem] tracking-wide"
              style={{ background: '#1a1a1a', border: '0.5px solid #333', color: '#999', fontFamily: 'var(--font-mono)' }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MapCard({ map }: { map: MapArticle }) {
  const color = getCategoryColor(map.category)
  const label = categoryLabels[map.category]
  return (
    <Link
      href={`/${map.category}/${map.slug}`}
      className="flex flex-col justify-between p-6 rounded transition-colors group"
      style={{ background: '#111', border: '0.5px solid #2e2e2e' }}
    >
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span
            className="text-[0.65rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: '#888' }}
          >
            {label}
          </span>
        </div>
        <h3
          className="text-sm font-semibold mb-2 leading-snug"
          style={{ color: '#f0ece4' }}
        >
          {map.title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
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
      style={{ background: '#111', border: '0.5px solid #2e2e2e' }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: '#888' }}>
              {label}
            </span>
          </div>
          <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: '#555' }}>
            {map.fileNumber}
          </span>
        </div>
        <h2
          className="font-bold leading-tight tracking-tight"
          style={{ color: '#f0ece4', fontSize: primary ? '2.5rem' : '1.75rem' }}
        >
          {map.title}
        </h2>
        <p
          className="leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#b0aca4', fontSize: primary ? '1rem' : '0.875rem' }}
        >
          {map.deck}
        </p>
      </div>
      <div
        className="text-[0.6rem] uppercase tracking-widest mt-6 pt-4"
        style={{ borderTop: `0.5px solid #222`, fontFamily: 'var(--font-mono)', color }}
      >
        Read map →
      </div>
    </Link>
  )
}

export default function HomePage() {
  const maps = getAllMaps()
  const featured1 = maps.find((m) => m.slug === 'pope-francis') ?? maps[0]
  const featured2 = maps.find((m) => m.slug === 'elon-musk') ?? maps[1]
  const recent = maps.slice(0, 3)

  return (
    <div>
      {/* Orientation */}
      <section
        className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ borderBottom: '0.5px solid #1e1e1e' }}
      >
        <p
          className="text-sm leading-relaxed max-w-2xl"
          style={{ fontFamily: 'var(--font-serif)', color: '#888', fontStyle: 'italic' }}
        >
          Mind Report publishes psychological maps of public figures, cultural events, and creative works.
          Each map reads its subject as terrain: identifying the wound beneath the pattern, the architecture beneath the behavior.
        </p>
        <a
          href="https://www.relohu.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.65rem] uppercase tracking-widest whitespace-nowrap px-4 py-2 rounded flex-shrink-0 transition-colors"
          style={{ fontFamily: 'var(--font-mono)', color: '#666', border: '0.5px solid #2e2e2e' }}
        >
          Get your own map →
        </a>
      </section>

      {/* Hero — two featured maps */}
      <section
        className="px-8 py-8 grid gap-4 items-stretch grid-cols-1 md:grid-cols-[3fr_2fr]"
        style={{ borderBottom: '0.5px solid #2e2e2e' }}
      >
        <FeaturedCard map={featured1} primary />
        <FeaturedCard map={featured2} />
      </section>

      {/* Recent maps */}
      <section className="px-8 py-12">
        <h2
          className="text-xs uppercase tracking-widest mb-8"
          style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
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
