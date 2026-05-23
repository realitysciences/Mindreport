// Compact map-legend strip shown above the terrain sections.
// Lists all terrain labels in order; primary labels are bolded + colored.

import type { TerrainSlice } from '@/lib/reportTypes'

export function TerrainOverview({
  terrainMap,
  accentColor,
}: {
  terrainMap: TerrainSlice[]
  accentColor: string
}) {
  return (
    <div
      style={{
        marginBottom: '2.5rem',
        padding: '1.1rem 1.4rem',
        background: `${accentColor}05`,
        border: `1px solid ${accentColor}18`,
        borderRadius: '3px',
      }}
    >
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Terrain Map
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '0.45rem', columnGap: '0' }}>
        {terrainMap.map((slice, i) => {
          const isPrimary = slice.prominence === 'primary'
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: isPrimary ? 700 : 400,
                color: isPrimary ? accentColor : 'var(--text-mid)',
              }}>
                {slice.label}
              </span>
              {i < terrainMap.length - 1 && (
                <span style={{ color: 'var(--border)', margin: '0 0.3rem', fontSize: '0.72rem' }}>·</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
