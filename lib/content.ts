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
