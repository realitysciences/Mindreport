// A single terrain section — the decorative number, label, summary,
// body paragraphs, and recognition signal pills.

import type { TerrainSlice } from '@/lib/reportTypes'

export function TerrainSection({
  slice,
  index,
  accentColor,
}: {
  slice: TerrainSlice
  index: number
  accentColor: string
}) {
  const paragraphs = slice.body.split(/\n+/).map(p => p.trim()).filter(Boolean)
  const isPrimary  = slice.prominence === 'primary'

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* Decorative chapter number */}
        <div style={{ flexShrink: 0, width: '3.25rem', textAlign: 'right' }}>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: '2.75rem', fontWeight: 800,
            lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none',
            color: isPrimary ? `${accentColor}28` : `${accentColor}14`,
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, paddingTop: '0.25rem' }}>

          {/* Label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: accentColor,
              letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
            }}>
              {slice.label}
            </span>
            {isPrimary && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.54rem', letterSpacing: '0.12em',
                color: accentColor, background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                borderRadius: '999px', padding: '0.08rem 0.45rem', fontWeight: 700,
              }}>
                PRIMARY
              </span>
            )}
          </div>

          {/* Summary */}
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.1rem' }}>
            {slice.summary}
          </p>

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.78 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Recognition signals */}
          {(slice.markers?.length ?? 0) > 0 && (
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.57rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '0.5rem',
              }}>
                Recognition signals
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {slice.markers.map((m, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: accentColor,
                    background: `${accentColor}10`, border: `1px solid ${accentColor}22`,
                    borderRadius: '999px', padding: '0.22rem 0.7rem', letterSpacing: '0.03em',
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
