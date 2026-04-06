import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#161616',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              color: '#f0ece4',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              fontFamily: 'serif',
            }}
          >
            MR
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
