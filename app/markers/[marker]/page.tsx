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
      <div className="mb-10">
        <p
          className="text-[0.6rem] uppercase tracking-widest mb-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          Terrain Marker
        </p>
        <h1
          className="font-bold leading-tight mb-2"
          style={{ color: 'var(--text-hi)', fontSize: '1.5rem' }}
        >
          {found.marker}
        </h1>
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
        >
          {maps.length} {maps.length === 1 ? 'map' : 'maps'} carrying this marker
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {maps.map((map) => {
          const color = getCategoryColor(map.category)
          const label = categoryLabels[map.category]
          return (
            <Link
              key={map.slug}
              href={`/${map.category}/${map.slug}`}
              className="flex flex-col justify-between rounded transition-colors overflow-hidden"
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
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
                  <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${color}55 0%, ${color}22 50%, ${color}08 100%)` }} />
                )}
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}>
                    {label}
                  </span>
                </div>
                <h2 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-hi)' }}>
                  {map.title}
                </h2>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-lo)' }}>
                  {map.deck}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
