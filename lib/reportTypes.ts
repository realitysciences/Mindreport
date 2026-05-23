// Shared types for report rendering — used by both the report page and the
// shareable /map page.

export type TerrainSlice = {
  label: string
  prominence: 'primary' | 'secondary' | 'supporting'
  summary: string
  body: string
  markers: string[]
}

export type MapResult = {
  title: string
  quote: string
  terrainMap: TerrainSlice[]
  corePattern: string
  hiddenCost: string
  unseen?: string
  // Tiered next moves (nextMove kept for backward compat with older results)
  nextMoveNow?: string
  nextMoveStructural?: string
  nextMove?: string
}
