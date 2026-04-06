import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllMaps, getMapBySlug } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { MarkdownBody } from '@/lib/markdown'

export function generateStaticParams() {
  return getAllMaps().map((m) => ({ category: m.category, slug: m.slug }))
}

export default async function ArticlePage(props: PageProps<'/[category]/[slug]'>) {
  const { slug } = await props.params
  const map = getMapBySlug(slug)
  if (!map) notFound()

  const color = getCategoryColor(map.category)
  const label = categoryLabels[map.category]
  const allMaps = getAllMaps()
  const related = map.relatedMaps
    .map((s) => allMaps.find((m) => m.slug === s))
    .filter(Boolean) as typeof allMaps

  return (
    <div className="px-6 py-12">
      <div className="mx-auto" style={{ maxWidth: '780px' }}>

        {/* Disclaimer strip */}
        <div
          className="flex items-center justify-between gap-4 px-4 py-2 rounded mb-8 text-[0.6rem] uppercase tracking-widest"
          style={{ background: '#111', border: '0.5px solid #2a2a2a', fontFamily: 'var(--font-mono)', color: '#555' }}
        >
          <span>Interpretive opinion based on public record. Not a clinical assessment.</span>
          <a href="/legal" style={{ color: '#555', whiteSpace: 'nowrap' }} className="hover:text-[#888] transition-colors">
            Legal →
          </a>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <Link
            href={`/${map.category}`}
            className="text-xs uppercase tracking-widest transition-colors hover:text-[#c8c4bc]"
            style={{ fontFamily: 'var(--font-mono)', color: '#888' }}
          >
            {label}
          </Link>
          <span style={{ color: '#444' }}>·</span>
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
          >
            {map.fileNumber}
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-bold leading-tight tracking-tight mb-5"
          style={{ color: '#f0ece4', fontSize: '42px' }}
        >
          {map.title}
        </h1>

        {/* Deck */}
        <p
          className="mb-8 text-base leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#b0aca4' }}
        >
          {map.deck}
        </p>

        {/* Meta row */}
        <div
          className="flex gap-8 text-xs mb-10 pb-8"
          style={{ borderBottom: '0.5px solid #222', fontFamily: 'var(--font-mono)' }}
        >
          {[
            { label: 'TYPE', value: label },
            { label: 'SUBJECT', value: map.subject },
            { label: 'FILE', value: map.fileNumber },
            ...(map.publishedDate ? [{ label: 'POSTED', value: new Date(map.publishedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }] : []),
          ].map(({ label: l, value }) => (
            <div key={l} className="flex flex-col gap-1">
              <span style={{ color: '#666', fontSize: '0.6rem', letterSpacing: '0.1em' }}>{l}</span>
              <span style={{ color: '#bbb' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Body with floating terrain card */}
        <div className="relative">
          {/* Terrain map card — floats right */}
          <div
            className="md:float-right md:ml-8 mb-6 p-5 rounded text-xs flex flex-col gap-3 w-full md:w-60"
            style={{ background: '#111', border: '0.5px solid #2e2e2e' }}
          >
            <div
              className="text-[0.6rem] uppercase tracking-widest mb-1"
              style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
            >
              Terrain Map
            </div>
            {[
              { label: 'CORE ORIENTATION', value: map.terrainMap.coreOrientation },
              { label: 'PRIMARY WOUND', value: map.terrainMap.primaryWound },
              { label: 'DOMINANT PATTERN', value: map.terrainMap.dominantPattern },
              { label: 'RELATIONAL STYLE', value: map.terrainMap.relationalStyle },
            ].map(({ label: l, value }) => (
              <div key={l} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#999', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                    {l}
                  </span>
                </div>
                <span style={{ color: '#bbb', paddingLeft: '1rem', fontSize: '0.7rem' }}>{value}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', color: '#999', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                  TERRAIN MARKERS
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pl-4">
                {map.terrainMap.markers.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: '#1a1a1a',
                      border: '0.5px solid #333',
                      color: '#999',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.55rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <MarkdownBody content={map.body} categoryColor={color} />
          <div style={{ clear: 'both' }} />
        </div>

        {/* Related maps */}
        {related.length > 0 && (
          <div className="mt-16 pt-10" style={{ borderTop: '0.5px solid #2e2e2e' }}>
            <h2
              className="text-xs uppercase tracking-widest mb-6"
              style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
            >
              Related maps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel) => {
                const rc = getCategoryColor(rel.category)
                const rl = categoryLabels[rel.category]
                return (
                  <Link
                    key={rel.slug}
                    href={`/${rel.category}/${rel.slug}`}
                    className="flex flex-col gap-2 p-4 rounded transition-colors"
                    style={{ background: '#111', border: '0.5px solid #2e2e2e' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: rc }} />
                      <span
                        className="text-[0.6rem] uppercase tracking-widest"
                        style={{ fontFamily: 'var(--font-mono)', color: '#888' }}
                      >
                        {rl}
                      </span>
                    </div>
                    <span className="text-sm font-medium leading-snug" style={{ color: '#e8e4dc' }}>
                      {rel.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA strip */}
        <div
          className="mt-12 p-8 rounded flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
          style={{ background: '#111', border: '0.5px solid #2e2e2e' }}
        >
          <div className="flex flex-col gap-2 max-w-md">
            <span className="text-sm font-semibold" style={{ color: '#e8e4dc' }}>
              You have a map too.
            </span>
            <span className="text-xs leading-relaxed" style={{ color: '#888', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Every pattern on this page exists because someone's interior became legible. ReLoHu sessions produce the same quality of reading, applied to you, with full information rather than reconstructed signal.
            </span>
          </div>
          <a
            href="https://www.relohu.com"
            className="text-xs uppercase tracking-widest px-5 py-3 rounded transition-colors whitespace-nowrap"
            style={{
              border: '0.5px solid #bbb',
              color: '#bbb',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Get your own map →
          </a>
        </div>
      </div>
    </div>
  )
}
