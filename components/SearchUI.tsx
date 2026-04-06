'use client'

import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapArticle } from '@/lib/types'
import { getCategoryColor, categoryLabels } from '@/lib/categoryUtils'

function searchMaps(maps: MapArticle[], query: string): MapArticle[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return maps.filter((m) => {
    return (
      m.title.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.deck.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      m.terrainMap.coreOrientation.toLowerCase().includes(q) ||
      m.terrainMap.primaryWound.toLowerCase().includes(q) ||
      m.terrainMap.dominantPattern.toLowerCase().includes(q) ||
      m.terrainMap.relationalStyle.toLowerCase().includes(q) ||
      m.terrainMap.markers.some((mk) => mk.toLowerCase().includes(q)) ||
      m.category.toLowerCase().includes(q)
    )
  })
}

export function SearchUI({ maps }: { maps: MapArticle[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  const results = useMemo(() => searchMaps(maps, query), [maps, query])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    const params = new URLSearchParams()
    if (val.trim()) params.set('q', val)
    router.replace(`/search${val.trim() ? `?q=${encodeURIComponent(val)}` : ''}`, { scroll: false })
  }

  return (
    <div className="px-8 py-12" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Search input */}
      <div className="relative mb-10">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search maps, subjects, terrain markers…"
          className="w-full bg-transparent outline-none text-2xl"
          style={{
            color: 'var(--text-hi)',
            borderBottom: '0.5px solid var(--border)',
            paddingBottom: '0.75rem',
            fontFamily: 'var(--font-serif)',
            caretColor: '#7F77DD',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); router.replace('/search', { scroll: false }) }}
            className="absolute right-0 top-1 text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
          >
            clear
          </button>
        )}
      </div>

      {/* Results count */}
      {query.trim() && (
        <div
          className="text-xs uppercase tracking-widest mb-6"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
        >
          {results.length === 0
            ? 'No maps found'
            : `${results.length} ${results.length === 1 ? 'map' : 'maps'}`}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col" style={{ gap: '0.5px', background: 'var(--border)' }}>
          {results.map((map) => {
            const color = getCategoryColor(map.category)
            const label = categoryLabels[map.category]
            return (
              <Link
                key={map.slug}
                href={`/${map.category}/${map.slug}`}
                className="flex items-start justify-between gap-6 px-5 py-4 transition-colors"
                style={{ background: 'var(--surface)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#161616')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#111')}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-hi)' }}
                      >
                        {map.title}
                      </span>
                      <span
                        className="text-[0.6rem] uppercase tracking-widest flex-shrink-0"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
                      >
                        {map.fileNumber}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed truncate"
                      style={{ color: 'var(--text-mid)', maxWidth: '520px' }}
                    >
                      {map.deck}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[0.6rem] uppercase tracking-widest flex-shrink-0 mt-1"
                  style={{ fontFamily: 'var(--font-mono)', color }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!query.trim() && (
        <div
          className="text-xs leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-ghost)' }}
        >
          {maps.length} maps indexed
        </div>
      )}
    </div>
  )
}
