import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllMarkers, getMapsByMarker } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'

export function generateStaticParams() {
  return getAllMarkers().map(({ slug }) => ({ marker: slug }))
}

export async function generateMetadata(props: PageProps<'/markers/[marker]'>): Promise<Metadata> {
  const { marker } = await props.params
  const all = getAllMarkers()
  const found = all.find(m => m.slug === marker)
  if (!found) return {}
  return {
    title: `${found.marker} | Mind Report`,
    description: `Maps tagged with the terrain marker "${found.marker}" - psychological cartography by Mind Report.`,
  }
}

export default async function MarkerPage(props: PageProps<'/markers/[marker]'>) {
  const { marker } = await props.params
  const all = getAllMarkers()
  const found = all.find(m => m.slug === marker)
  if (!found) notFound()

  const maps = getMapsByMarker(marker)

  return (
    <div className="px-8 py-12">
      <div className="mx-auto" style={{ maxWidth: '1200px' }}>
        <div className="mb-10">
          <span
            className="text-[0.65rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
          >
            Terrain Marker
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '2rem', letterSpacing: '-0.02em' }}
          >
            {found.marker}
          </h1>
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
          >
            {maps.length} {maps.length === 1 ? 'map' : 'maps'} carrying this marker
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {maps.map((map) => {
            const color = getCategoryColor(map.category)
            const label = categoryLabels[map.category]
            return (
              <Link
                key={map.slug}
                href={`/${map.category}/${map.slug}`}
                className="flex flex-col justify-between overflow-hidden rounded-sm group transition-opacity hover:opacity-90"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div style={{ height: '140px', overflow: 'hidden', flexShrink: 0 }}>
                  {map.image ? (
                    <img
                      src={map.image.url}
                      alt={map.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)` }} />
                  )}
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <span
                    className="text-[0.6rem] uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
                  >
                    {label}
                  </span>
                  <h2
                    className="font-bold leading-snug"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.1rem' }}
                  >
                    {map.title}
                  </h2>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-mid)' }}>
                    {map.deck}
                  </p>
                  <span
                    className="text-[0.6rem] uppercase tracking-widest mt-auto pt-3"
                    style={{ borderTop: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
                  >
                    Read map →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
