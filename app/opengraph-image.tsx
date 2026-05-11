import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ width: '100%', height: '5px', background: '#7F77DD', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '64px 80px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7F77DD' }} />
            <span style={{ color: '#7F77DD', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Psychological Cartography
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ color: '#f0ece4', fontSize: 88, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>
              Mind Report
            </div>
            <div style={{ color: '#7a7570', fontSize: 26, lineHeight: 1.5, fontStyle: 'italic', maxWidth: '760px' }}>
              Psychological maps of public figures, cultural events, creative works, and archetypes.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#555', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              by ReLoHu
            </span>
            <span style={{ color: '#333', fontSize: 16 }}>mindreport.ai</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
