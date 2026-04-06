import { Suspense } from 'react'
import { getAllMaps } from '@/lib/content'
import { SearchUI } from '@/components/SearchUI'

export default function SearchPage() {
  const maps = getAllMaps()
  return (
    <Suspense>
      <SearchUI maps={maps} />
    </Suspense>
  )
}
