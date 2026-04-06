import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMapsByCategory } from '@/lib/content'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'
import { Category } from '@/lib/types'

const validCategories: Category[] = ['people', 'events', 'relationships', 'works', 'archetypes']

export function generateStaticParams() {
  return validCategories.map((category) => ({ category }))
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
      <div className="flex items-center gap-2 mb-10">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
        <h1
          className="text-xs uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-hi)' }}
        >
          {label}
        </h1>
        <span style={{ color: 'var(--text-ghost)' }}>·</span>
        <span
          className="text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
        >
          {maps.length} {maps.length === 1 ? 'map' : 'maps'}
        </span>
      </div>

      {maps.length === 0 ? (
        <p style={{ color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          No maps in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {maps.map((map) => (
            <Link
              key={map.slug}
              href={`/${map.category}/${map.slug}`}
              className="flex flex-col justify-between p-6 rounded transition-colors"
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[0.6rem] uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
                  >
                    {map.fileNumber}
                  </span>
                </div>
                <h2
                  className="text-sm font-semibold mb-2 leading-snug"
                  style={{ color: 'var(--text-hi)' }}
                >
                  {map.title}
                </h2>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-mid)' }}>
                  {map.deck}
                </p>
              </div>
              <div
                className="text-[0.6rem] uppercase tracking-widest pt-3"
                style={{ borderTop: '0.5px solid #222', fontFamily: 'var(--font-mono)', color: color }}
              >
                Read map →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
