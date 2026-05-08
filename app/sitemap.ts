import type { MetadataRoute } from 'next'
import { getAllMaps } from '@/lib/content'
import { Category } from '@/lib/types'

const BASE_URL = 'https://mindreport.ai'
const CATEGORIES: Category[] = ['people', 'events', 'relationships', 'works', 'archetypes']

export default function sitemap(): MetadataRoute.Sitemap {
  const maps = getAllMaps()

  const mapUrls: MetadataRoute.Sitemap = maps.map((map) => ({
    url: `${BASE_URL}/${map.category}/${map.slug}`,
    lastModified: map.publishedDate ? new Date(map.publishedDate) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryUrls,
    ...mapUrls,
  ]
}
