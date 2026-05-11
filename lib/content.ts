import fs from 'fs'
import path from 'path'
import { MapArticle } from './types'

const mapsDir = path.join(process.cwd(), 'content/maps')

export function getAllMaps(): MapArticle[] {
  const files = fs.readdirSync(mapsDir).filter(f => f.endsWith('.json'))
  return files.map(f => JSON.parse(fs.readFileSync(path.join(mapsDir, f), 'utf-8')))
}

export function getMapBySlug(slug: string): MapArticle | undefined {
  return getAllMaps().find(m => m.slug === slug)
}

export function getMapsByCategory(category: string): MapArticle[] {
  return getAllMaps().filter(m => m.category === category)
}

export function getMapsByMarker(marker: string): MapArticle[] {
  return getAllMaps().filter(m =>
    m.terrainMap.markers.some(mk => slugifyMarker(mk) === marker)
  )
}

export function getAllMarkers(): { marker: string; slug: string; count: number }[] {
  const counts: Record<string, { marker: string; count: number }> = {}
  for (const map of getAllMaps()) {
    for (const mk of map.terrainMap.markers) {
      const slug = slugifyMarker(mk)
      if (!counts[slug]) counts[slug] = { marker: mk, count: 0 }
      counts[slug].count++
    }
  }
  return Object.entries(counts)
    .map(([slug, { marker, count }]) => ({ marker, slug, count }))
    .sort((a, b) => b.count - a.count)
}

export function slugifyMarker(marker: string): string {
  return marker.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
