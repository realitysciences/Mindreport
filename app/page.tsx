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

export default function HomePage() {
  const maps = getAllMaps()
  const featured = maps.find((m) => m.slug === 'elon-musk') ?? maps[0]
  const recent = maps.slice(0, 3)
  const color = getCategoryColor(featured.category)
  const label = categoryLabels[featured.category]

  return (
    <div>
      {/* Hero */}
      <section
        className="px-8 py-10 grid gap-10 items-start"
        style={{ borderBottom: '0.5px solid #2e2e2e', gridTemplateColumns: '1fr 320px' }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: '#888' }}
            >
              {label}
            </span>
          </div>
          <h1
            className="text-5xl font-bold leading-tight tracking-tight"
            style={{ color: '#f0ece4' }}
          >
            {featured.title}
          </h1>
          <p
            className="text-base leading-relaxed max-w-lg"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#b0aca4' }}
          >
            {featured.deck}
          </p>
          <div
            className="flex gap-6 text-xs pt-2"
            style={{ fontFamily: 'var(--font-mono)', color: '#888', borderTop: '0.5px solid #222' }}
          >
            {[
              { label: 'TYPE', value: label },
              { label: 'SUBJECT', value: featured.subject },
              { label: 'FILE', value: featured.fileNumber },
            ].map(({ label: l, value }) => (
              <div key={l} className="flex flex-col gap-1 pt-3">
                <span style={{ color: '#666', fontSize: '0.6rem', letterSpacing: '0.1em' }}>{l}</span>
                <span style={{ color: '#bbb' }}>{value}</span>
              </div>
            ))}
          </div>
          <Link
            href={`/${featured.category}/${featured.slug}`}
            className="self-start mt-2 text-xs uppercase tracking-widest px-4 py-2 rounded transition-colors"
            style={{ border: `0.5px solid ${color}`, color, fontFamily: 'var(--font-mono)' }}
          >
            Read map →
          </Link>
        </div>
        <div className="flex items-start">
          <TerrainCard map={featured} color={color} />
        </div>
      </section>

      {/* Recent maps */}
      <section className="px-8 py-12">
        <h2
          className="text-xs uppercase tracking-widest mb-8"
          style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
        >
          Recent maps
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {recent.map((m) => (
            <MapCard key={m.slug} map={m} />
          ))}
        </div>
      </section>
    </div>
  )
}
