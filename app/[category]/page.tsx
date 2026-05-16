import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getMapsByCategory } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { Category } from '@/lib/types'

const validCategories: Category[] = ['people', 'events', 'relationships', 'works', 'archetypes']

export function generateStaticParams() {
  return validCategories.map((category) => ({ category }))
}

export async function generateMetadata(props: PageProps<'/[category]'>): Promise<Metadata> {
  const { category } = await props.params
  const label = categoryLabels[category as Category]
  if (!label) return {}
  return {
    title: `${label} | Mind Report`,
    description: `Psychological maps of ${label.toLowerCase()} - terrain analysis of the figures, events, and works that shaped culture.`,
    alternates: {
      canonical: `https://mindreport.ai/${category}`,
    },
  }
}

export default async function CategoryPage(props: PageProps<'/[category]'>) {
  const { category } = await props.params

  if (!validCategories.includes(category as Category)) notFound()

  const cat = category as Category
  const maps = getMapsByCategory(cat)
  const color = getCategoryColor(cat)
  const label = categoryLabels[cat]

  return (
    <div className="px-8 py-12">
      <div className="mx-auto" style={{ maxWidth: '1200px' }}>
        <div className="flex items-baseline gap-3 mb-10">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
          <h1
            className="font-bold"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '2rem' }}
          >
            {label}
          </h1>
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
          >
            {maps.length} {maps.length === 1 ? 'map' : 'maps'}
          </span>
        </div>

        {maps.length === 0 ? (
          <p style={{ color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            No maps in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {maps.map((map) => (
              <Link
                key={map.slug}
                href={`/${map.category}/${map.slug}`}
                className="flex flex-col justify-between overflow-hidden rounded-sm group transition-opacity hover:opacity-90"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
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
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <span
                        className="text-[0.6rem] uppercase tracking-widest"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.14em' }}
                      >
                        {map.fileNumber}
                      </span>
                    </div>
                    <h2
                      className="font-bold mb-2 leading-snug"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.1rem' }}
                    >
                      {map.title}
                    </h2>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-mid)' }}>
                      {map.deck}
                    </p>
                  </div>
                  <div
                    className="text-[0.6rem] uppercase tracking-widest pt-3"
                    style={{ borderTop: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
                  >
                    Read map →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
