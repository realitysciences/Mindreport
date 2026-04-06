import { Category } from './types'

export const categoryColors: Record<Category, string> = {
  people: '#7F77DD',
  events: '#BA7517',
  relationships: '#D4537E',
  works: '#378ADD',
}

export const categoryLabels: Record<Category, string> = {
  people: 'People',
  events: 'Events',
  relationships: 'Relationships',
  works: 'Works',
}

export function getCategoryColor(cat: Category): string {
  return categoryColors[cat]
}
