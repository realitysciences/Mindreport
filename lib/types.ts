export type Category = 'people' | 'events' | 'relationships' | 'works' | 'archetypes'

export interface TerrainMap {
  coreOrientation: string
  primaryWound: string
  dominantPattern: string
  relationalStyle: string
  secondaryPattern: string
  markers: string[]
}

export interface MapArticle {
  title: string
  slug: string
  category: Category
  fileNumber: string
  subject: string
  deck: string
  terrainMap: TerrainMap
  body: string
  relatedMaps: string[]
  publishedDate?: string
  image?: {
    url: string
    caption: string
  }
}
