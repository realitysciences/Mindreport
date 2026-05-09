import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllMaps, getMapBySlug } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { MarkdownBody } from '@/lib/markdown'

export function generateStaticParams() {
  return getAllMaps().map((m) => ({ category: m.category, slug: m.slug }))
}

export async function generateMetadata(props: PageProps<'/[category]/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const map = getMapBySlug(slug)
  if (!map) return {}
  return {
    title: `${map.title} | Mind Report`,
    description: map.deck,
  }
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

  const postedLabel = map.publishedDate
    ? new Date(map.publishedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="px-6 py-12">
      <div className="mx-auto" style={{ maxWidth: '780px' }}>

        {/* Disclaimer strip */}
        <div
          className="flex items-center justify-between gap-4 px-4 py-2 rounded mb-8 text-[0.6rem] uppercase tracking-widest"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          <span>Interpretive opinion based on public record. Not a clinical assessment.</span>
          <a href="/legal" style={{ color: 'var(--text-faint)', whiteSpace: 'nowrap' }} className="hover:text-[#888] transition-colors">
            Legal →
          </a>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <Link
            href={`/${map.category}`}
            className="text-xs uppercase tracking-widest transition-colors hover:text-[#c8c4bc]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}
          >
            {label}
          </Link>
          <span style={{ color: 'var(--text-ghost)' }}>·</span>
          <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}>
            {map.fileNumber}
          </span>
          {postedLabel && (
            <>
              <span style={{ color: 'var(--text-ghost)' }}>·</span>
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}>
                {postedLabel}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-bold leading-tight tracking-tight mb-5" style={{ color: 'var(--text-hi)', fontSize: '42px' }}>
          {map.title}
        </h1>

        {/* Deck */}
        <p
          className="mb-10 text-base leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)' }}
        >
          {map.deck}
        </p>

        {/* Image */}
        {map.image && (
          <figure className="mb-10">
            <img
              src={map.image.url}
              alt={map.title}
              loading="lazy"
              className="rounded-lg"
              style={{ display: 'block', maxWidth: '100%', maxHeight: '480px', margin: '0 auto', border: '0.5px solid var(--border)' }}
            />
            <figcaption
              className="mt-2 text-center"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', lineHeight: '1.5' }}
            >
              {map.image.caption}
            </figcaption>
          </figure>
        )}

        {/* ── AT A GLANCE infographic panel ────────────────────────────────── */}
        <div className="mb-14 rounded-lg overflow-hidden" style={{ border: `1px solid ${color}55` }}>

          {/* Panel header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ background: color, borderBottom: `1px solid ${color}` }}
          >
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-hi)', fontFamily: 'var(--font-mono)' }}>
              At a Glance
            </span>
            <span className="text-xs" style={{ color: 'var(--text-hi)', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
              {map.subject}
            </span>
          </div>

          {/* Core orientation — full-width hero cell */}
          <div className="px-6 py-5" style={{ background: `${color}18`, borderBottom: `0.5px solid ${color}33` }}>
            <div
              className="text-[0.55rem] uppercase tracking-widest mb-2"
              style={{ fontFamily: 'var(--font-mono)', color }}
            >
              Core Orientation
            </div>
            <p
              className="text-lg font-semibold leading-snug"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-hi)' }}
            >
              {map.terrainMap.coreOrientation}
            </p>
          </div>

          {/* Two-column: Wound + Pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderBottom: `0.5px solid var(--border-sub)` }}>
            <div className="px-5 py-4" style={{ borderRight: '0.5px solid var(--border-sub)' }}>
              <div
                className="text-[0.55rem] uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-mono)', color }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                Primary Wound
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                {map.terrainMap.primaryWound}
              </p>
            </div>
            <div className="px-5 py-4">
              <div
                className="text-[0.55rem] uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-mono)', color }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                Dominant Pattern
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                {map.terrainMap.dominantPattern}
              </p>
            </div>
          </div>

          {/* Relational style */}
          <div className="px-5 py-4" style={{ borderBottom: `0.5px solid var(--border-sub)` }}>
            <div
              className="text-[0.55rem] uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-mono)', color }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              Relational Style
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
              {map.terrainMap.relationalStyle}
            </p>
          </div>

          {/* Secondary pattern */}
          <div className="px-5 py-4" style={{ borderBottom: `0.5px solid var(--border-sub)` }}>
            <div
              className="text-[0.55rem] uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#555' }} />
              Secondary Pattern
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
              {map.terrainMap.secondaryPattern}
            </p>
          </div>

          {/* Terrain markers */}
          <div className="px-5 py-4" style={{ background: 'var(--surface-deep)' }}>
            <div
              className="text-[0.55rem] uppercase tracking-widest mb-3"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
            >
              Terrain Markers
            </div>
            <div className="flex flex-wrap gap-2">
              {map.terrainMap.markers.map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 rounded-full text-[0.65rem] tracking-wide"
                  style={{
                    background: `${color}18`,
                    border: `0.5px solid ${color}55`,
                    color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <MarkdownBody content={map.body} categoryColor={color} />

        {/* Related maps */}
        {related.length > 0 && (
          <div className="mt-16 pt-10" style={{ borderTop: '0.5px solid var(--border)' }}>
            <h2
              className="text-xs uppercase tracking-widest mb-6"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
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
                    style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: rc }} />
                      <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}>
                        {rl}
                      </span>
                    </div>
                    <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-strong)' }}>
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
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        >
          <div className="flex flex-col gap-2 max-w-md">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>You have a map too.</span>
            <span className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Every pattern on this page exists because someone's interior became legible. ReLoHu sessions produce the same quality of reading, applied to you, with full information rather than reconstructed signal.
            </span>
          </div>
          <a
            href="https://www.relohu.com"
            className="text-xs uppercase tracking-widest px-5 py-3 rounded transition-colors whitespace-nowrap"
            style={{ border: '0.5px solid #bbb', color: 'var(--text-nav)', fontFamily: 'var(--font-mono)' }}
          >
            Get your own map →
          </a>
        </div>

      </div>
    </div>
  )
}
