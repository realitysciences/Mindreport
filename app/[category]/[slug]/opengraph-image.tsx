import { ImageResponse } from 'next/og'
import { getMapBySlug } from '@/lib/content'
import { categoryColors, categoryLabels } from '@/lib/categoryUtils'
import { Category } from '@/lib/types'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string; category: string }> }) {
  const { slug } = await params
  const map = getMapBySlug(slug)

  if (!map) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#888', fontSize: 48 }}>Mind Report</span>
      </div>
    )
  }

  const color = categoryColors[map.category as Category] ?? '#888'
  const label = categoryLabels[map.category as Category] ?? map.category
  const deck = map.deck.length > 140 ? map.deck.slice(0, 138) + '...' : map.deck

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top color bar */}
        <div style={{ width: '100%', height: '5px', background: color, flexShrink: 0 }} />

        {/* Content area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '64px 80px', justifyContent: 'space-between' }}>

          {/* Top row: category dot + label + file number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: color, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {label}
            </span>
            <span style={{ color: '#333', fontSize: 16, letterSpacing: '0.1em' }}>{map.fileNumber}</span>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                color: '#f0ece4',
                fontSize: map.title.length > 24 ? 64 : 80,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {map.title}
            </div>
            {/* Deck */}
            <div
              style={{
                color: '#7a7570',
                fontSize: 22,
                lineHeight: 1.55,
                maxWidth: '860px',
                fontStyle: 'italic',
              }}
            >
              {deck}
            </div>
          </div>

          {/* Bottom: Mind Report branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
              <span style={{ color: '#555', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Mind Report
              </span>
            </div>
            <span style={{ color: '#333', fontSize: 16, letterSpacing: '0.05em' }}>mindreport.ai</span>
          </div>

        </div>
      </div>
    ),
    { ...size }
  )
}
