import React from 'react'

// ─── Inline formatters ────────────────────────────────────────────────────────

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f0ece4">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

// ─── Section illustration classifier ─────────────────────────────────────────

type IllustrationKind =
  | 'fracture' | 'architecture' | 'orbit' | 'flow'
  | 'confluence' | 'signal' | 'lens' | 'transformation' | 'terrain'

function classifyHeader(header: string): IllustrationKind {
  const h = header.toLowerCase()
  if (/wound|trauma|pain|loss|hurt|broke|crack|fracture|early|origin|child|dark|shadow|beneath|scar/.test(h)) return 'fracture'
  if (/control|power|architect|system|engine|structure|machine|build|design|order|framework|scaffold/.test(h)) return 'architecture'
  if (/mission|identity|self|core|center|purpose|drive|ego|who|am|fundamental|soul|inner/.test(h)) return 'orbit'
  if (/behav|cycle|repeat|loop|compuls|habit|mechanism|response|pattern|pull|logic/.test(h)) return 'flow'
  if (/relat|attach|connect|love|bond|together|partnership|between|covenant|marriage|dynamic/.test(h)) return 'confluence'
  if (/voice|speak|truth|reveal|show|appear|perform|present|surface|signal|message|public/.test(h)) return 'signal'
  if (/observ|watch|see|study|record|map|read|analys|know|understand|lens|view|perspect/.test(h)) return 'lens'
  if (/transform|change|arc|shift|evolution|rebirth|recover|new|after|become|made/.test(h)) return 'transformation'
  return 'terrain'
}

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function FractureIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      <circle cx="350" cy="65" r="55" stroke={color} strokeWidth="0.5" opacity="0.12" />
      <circle cx="350" cy="65" r="38" stroke={color} strokeWidth="0.5" opacity="0.18" />
      <circle cx="350" cy="65" r="22" stroke={color} strokeWidth="0.75" opacity="0.25" />
      <path d="M350 65 L330 20 L355 48 L340 5" stroke={color} strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
      <path d="M350 65 L390 35 L370 55" stroke={color} strokeWidth="0.9" opacity="0.55" strokeLinecap="round" />
      <path d="M350 65 L305 90 L295 125" stroke={color} strokeWidth="1" opacity="0.6" strokeLinecap="round" />
      <path d="M350 65 L410 95 L430 125" stroke={color} strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />
      <path d="M350 65 L280 60 L240 50" stroke={color} strokeWidth="0.7" opacity="0.35" strokeLinecap="round" />
      <rect x="200" y="30" width="3" height="3" fill={color} opacity="0.27" transform="rotate(22 200 30)" />
      <rect x="160" y="75" width="3" height="3" fill={color} opacity="0.20" transform="rotate(44 160 75)" />
      <rect x="430" y="28" width="3" height="3" fill={color} opacity="0.34" transform="rotate(66 430 28)" />
      <rect x="480" y="70" width="3" height="3" fill={color} opacity="0.20" transform="rotate(88 480 70)" />
      <rect x="560" y="40" width="3" height="3" fill={color} opacity="0.27" transform="rotate(110 560 40)" />
      <rect x="130" y="110" width="3" height="3" fill={color} opacity="0.20" transform="rotate(132 130 110)" />
      <circle cx="350" cy="65" r="3.5" fill={color} opacity="0.85" />
    </svg>
  )
}

function ArchitectureIllustration({ color }: { color: string }) {
  const cols = [80, 175, 270, 350, 430, 525, 620]
  const rows = [30, 65, 100]
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      {rows.map(y => cols.slice(0, -1).map((x, xi) => (
        <line key={`h${x}${y}`} x1={x} y1={y} x2={cols[xi+1]} y2={y} stroke={color} strokeWidth="0.5" opacity="0.12" />
      )))}
      {cols.map(x => rows.slice(0, -1).map((y, yi) => (
        <line key={`v${x}${y}`} x1={x} y1={y} x2={x} y2={rows[yi+1]} stroke={color} strokeWidth="0.5" opacity="0.12" />
      )))}
      <line x1="350" y1="65" x2="80" y2="30" stroke={color} strokeWidth="0.4" opacity="0.09" />
      <line x1="350" y1="65" x2="620" y2="30" stroke={color} strokeWidth="0.4" opacity="0.09" />
      <line x1="350" y1="65" x2="80" y2="100" stroke={color} strokeWidth="0.4" opacity="0.09" />
      <line x1="350" y1="65" x2="620" y2="100" stroke={color} strokeWidth="0.4" opacity="0.09" />
      {cols.map(x => rows.map(y => {
        const isHub = x === 350 && y === 65
        return (
          <circle key={`n${x}${y}`} cx={x} cy={y} r={isHub ? 6 : 2.5}
            fill={isHub ? color : '#1a1a1a'} stroke={color}
            strokeWidth={isHub ? 0 : 0.5} opacity={isHub ? 0.9 : 0.35} />
        )
      }))}
      <circle cx="350" cy="65" r="14" stroke={color} strokeWidth="0.5" opacity="0.18" />
      <circle cx="350" cy="65" r="25" stroke={color} strokeWidth="0.3" opacity="0.1" />
    </svg>
  )
}

function OrbitIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      <ellipse cx="350" cy="65" rx="220" ry="45" stroke={color} strokeWidth="0.5" opacity="0.10" />
      <ellipse cx="350" cy="65" rx="155" ry="33" stroke={color} strokeWidth="0.5" opacity="0.15" />
      <ellipse cx="350" cy="65" rx="90" ry="22" stroke={color} strokeWidth="0.75" opacity="0.22" />
      <ellipse cx="350" cy="65" rx="42" ry="14" stroke={color} strokeWidth="0.75" opacity="0.3" />
      <circle cx="570" cy="65" r="4" fill={color} opacity="0.5" />
      <circle cx="130" cy="65" r="3" fill={color} opacity="0.35" />
      <circle cx="205" cy="95" r="2.5" fill={color} opacity="0.3" />
      <circle cx="495" cy="35" r="2.5" fill={color} opacity="0.4" />
      <circle cx="440" cy="87" r="2" fill={color} opacity="0.25" />
      <circle cx="260" cy="43" r="2" fill={color} opacity="0.3" />
      <circle cx="350" cy="65" r="7" fill={color} opacity="0.7" />
      <circle cx="350" cy="65" r="3.5" fill={color} opacity="1" />
    </svg>
  )
}

function FlowIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      <path d="M0 25 C120 15,200 55,350 50 S520 20,700 30" stroke={color} strokeWidth="1" opacity="0.4" fill="none" />
      <path d="M0 65 C150 45,230 90,350 70 S500 50,700 65" stroke={color} strokeWidth="1.5" opacity="0.6" fill="none" />
      <path d="M0 105 C100 95,250 120,350 95 S550 85,700 100" stroke={color} strokeWidth="0.75" opacity="0.28" fill="none" />
      <path d="M688 27 L700 30 L688 33" stroke={color} strokeWidth="1" opacity="0.4" fill="none" strokeLinejoin="round" />
      <path d="M688 62 L700 65 L688 68" stroke={color} strokeWidth="1.5" opacity="0.6" fill="none" strokeLinejoin="round" />
      <path d="M688 97 L700 100 L688 103" stroke={color} strokeWidth="0.75" opacity="0.28" fill="none" strokeLinejoin="round" />
      <circle cx="70" cy="62" r="3" fill={color} opacity="0.35" />
      <circle cx="175" cy="74" r="3" fill={color} opacity="0.35" />
      <circle cx="280" cy="67" r="3" fill={color} opacity="0.35" />
      <circle cx="350" cy="70" r="5" fill={color} opacity="0.8" />
      <circle cx="430" cy="62" r="3" fill={color} opacity="0.35" />
      <circle cx="560" cy="58" r="3" fill={color} opacity="0.35" />
      <circle cx="630" cy="63" r="3" fill={color} opacity="0.35" />
    </svg>
  )
}

function ConfluenceIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      <circle cx="285" cy="65" r="52" stroke={color} strokeWidth="0.75" opacity="0.3" fill="none" />
      <circle cx="285" cy="65" r="35" stroke={color} strokeWidth="0.5" opacity="0.15" fill="none" />
      <circle cx="285" cy="65" r="5" fill={color} opacity="0.5" />
      <circle cx="415" cy="65" r="52" stroke={color} strokeWidth="0.75" opacity="0.3" fill="none" />
      <circle cx="415" cy="65" r="35" stroke={color} strokeWidth="0.5" opacity="0.15" fill="none" />
      <circle cx="415" cy="65" r="5" fill={color} opacity="0.5" />
      <path d="M350 24 C368 32,378 50,378 65 C378 80,368 98,350 106 C332 98,322 80,322 65 C322 50,332 32,350 24Z"
        fill={color} opacity="0.07" />
      <path d="M350 24 C368 32,378 50,378 65 C378 80,368 98,350 106 C332 98,322 80,322 65 C322 50,332 32,350 24Z"
        stroke={color} strokeWidth="0.5" opacity="0.22" fill="none" />
      <line x1="40" y1="65" x2="233" y2="65" stroke={color} strokeWidth="0.4" opacity="0.1" strokeDasharray="4 6" />
      <line x1="467" y1="65" x2="660" y2="65" stroke={color} strokeWidth="0.4" opacity="0.1" strokeDasharray="4 6" />
    </svg>
  )
}

function SignalIllustration({ color }: { color: string }) {
  const steps = 28
  const pts = ['0,65']
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * 700
    const amp = 28 * Math.pow(Math.sin((i / steps) * Math.PI), 0.4)
    const y = 65 + amp * Math.sin(i * 1.35)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const wave = 'M ' + pts.join(' L ')
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      <line x1="0" y1="65" x2="700" y2="65" stroke={color} strokeWidth="0.3" opacity="0.1" />
      <path d={wave} stroke={color} strokeWidth="0.5" opacity="0.15" />
      <path d={wave} stroke={color} strokeWidth="1.5" opacity="0.6" strokeLinejoin="round" />
      {[0,100,200,300,400,500,600,700].map(x => (
        <line key={x} x1={x} y1="60" x2={x} y2="70" stroke={color} strokeWidth="0.5" opacity="0.18" />
      ))}
    </svg>
  )
}

function LensIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      <ellipse cx="350" cy="65" rx="60" ry="48" stroke={color} strokeWidth="0.75" opacity="0.35" />
      <ellipse cx="350" cy="65" rx="38" ry="30" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <circle cx="350" cy="65" r="8" fill={color} opacity="0.45" />
      <circle cx="350" cy="65" r="4" fill={color} opacity="0.9" />
      <line x1="20" y1="23" x2="291" y2="55" stroke={color} strokeWidth="0.5" opacity="0.14" strokeDasharray="4 5" />
      <line x1="20" y1="65" x2="290" y2="65" stroke={color} strokeWidth="0.5" opacity="0.14" strokeDasharray="4 5" />
      <line x1="20" y1="107" x2="291" y2="75" stroke={color} strokeWidth="0.5" opacity="0.14" strokeDasharray="4 5" />
      <line x1="410" y1="55" x2="680" y2="23" stroke={color} strokeWidth="0.5" opacity="0.14" strokeDasharray="4 5" />
      <line x1="410" y1="65" x2="680" y2="65" stroke={color} strokeWidth="0.5" opacity="0.14" strokeDasharray="4 5" />
      <line x1="410" y1="75" x2="680" y2="107" stroke={color} strokeWidth="0.5" opacity="0.14" strokeDasharray="4 5" />
      <line x1="410" y1="65" x2="480" y2="65" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="480" cy="65" r="3" fill={color} opacity="0.65" />
      <circle cx="350" cy="65" r="72" stroke={color} strokeWidth="0.3" opacity="0.1" strokeDasharray="3 8" />
    </svg>
  )
}

function TransformationIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      {[0,14,28,42,56,70,84,98,112,126].map(y => (
        <line key={y} x1="0" y1={y} x2="700" y2={y} stroke={color} strokeWidth="0.25" opacity="0.04" />
      ))}
      <path d="M80 110 Q200 88,350 55 T622 18" stroke={color} strokeWidth="1.5" opacity="0.55" fill="none" strokeLinecap="round" />
      <path d="M80 120 Q200 120,350 120 T622 120" stroke={color} strokeWidth="0.5" opacity="0.08" fill="none" />
      <path d="M610 14 L624 18 L613 26" stroke={color} strokeWidth="1.25" opacity="0.55" fill="none" strokeLinejoin="round" />
      <circle cx="80" cy="110" r="4" fill="#1a1a1a" stroke={color} strokeWidth="0.75" opacity="0.3" />
      <circle cx="200" cy="84" r="3.5" fill="#1a1a1a" stroke={color} strokeWidth="0.75" opacity="0.5" />
      <circle cx="350" cy="55" r="3.5" fill="#1a1a1a" stroke={color} strokeWidth="0.75" opacity="0.5" />
      <circle cx="500" cy="32" r="3.5" fill="#1a1a1a" stroke={color} strokeWidth="0.75" opacity="0.5" />
      <circle cx="622" cy="18" r="6" fill={color} opacity="0.9" />
      <line x1="200" y1="84" x2="200" y2="120" stroke={color} strokeWidth="0.4" opacity="0.1" strokeDasharray="3 5" />
      <line x1="350" y1="55" x2="350" y2="120" stroke={color} strokeWidth="0.4" opacity="0.1" strokeDasharray="3 5" />
      <line x1="500" y1="32" x2="500" y2="120" stroke={color} strokeWidth="0.4" opacity="0.1" strokeDasharray="3 5" />
    </svg>
  )
}

function TerrainIllustration({ color }: { color: string }) {
  const contours = [
    'M0 110 C80 105,160 115,240 100 S380 80,460 95 S580 110,700 105',
    'M0 92 C90 85,170 98,260 82 S390 60,470 78 S590 92,700 88',
    'M0 75 C100 65,185 82,280 62 S400 40,480 60 S600 75,700 70',
    'M0 58 C110 46,195 65,300 44 S405 22,490 44 S610 58,700 53',
    'M0 42 C120 28,210 50,320 28 S412 8,500 28 S618 42,700 36',
  ]
  return (
    <svg viewBox="0 0 700 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }} aria-hidden="true">
      <rect width="700" height="130" fill="#0a0a0a" />
      {contours.map((d, i) => (
        <path key={i} d={d} stroke={color} strokeWidth="0.75" opacity={0.08 + i * 0.06} fill="none" />
      ))}
      <circle cx="412" cy="8" r="3" fill={color} opacity="0.6" />
      <line x1="412" y1="11" x2="412" y2="28" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 3" />
    </svg>
  )
}

function SectionIllustration({ header, color }: { header: string; color: string }) {
  const kind = classifyHeader(header)
  if (kind === 'fracture')       return <FractureIllustration color={color} />
  if (kind === 'architecture')   return <ArchitectureIllustration color={color} />
  if (kind === 'orbit')          return <OrbitIllustration color={color} />
  if (kind === 'flow')           return <FlowIllustration color={color} />
  if (kind === 'confluence')     return <ConfluenceIllustration color={color} />
  if (kind === 'signal')         return <SignalIllustration color={color} />
  if (kind === 'lens')           return <LensIllustration color={color} />
  if (kind === 'transformation') return <TransformationIllustration color={color} />
  return <TerrainIllustration color={color} />
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function MarkdownBody({ content, categoryColor }: { content: string; categoryColor: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean)

  return (
    <div>
      {blocks.map((block, i) => {
        const trimmed = block.trim()

        if (trimmed.startsWith('## ')) {
          const text = trimmed.slice(3)
          return (
            <div key={i} className="mt-14 mb-6 rounded overflow-hidden" style={{ border: '0.5px solid #1e1e1e' }}>
              <SectionIllustration header={text} color={categoryColor} />
              <div className="px-5 py-4" style={{ background: '#0e0e0e' }}>
                <h2
                  className="text-base font-semibold leading-snug tracking-tight"
                  style={{ color: '#e8e4dc' }}
                >
                  {text}
                </h2>
              </div>
            </div>
          )
        }

        if (trimmed.startsWith('> ')) {
          const text = trimmed.slice(2)
          return (
            <blockquote
              key={i}
              className="my-8 pl-6 py-1"
              style={{
                borderLeft: `2px solid ${categoryColor}66`,
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                lineHeight: '1.8',
                color: '#d0ccc4',
              }}
              dangerouslySetInnerHTML={{ __html: formatInline(text) }}
            />
          )
        }

        return (
          <p
            key={i}
            className="mb-6"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              lineHeight: '1.95',
              color: '#c8c4bc',
            }}
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        )
      })}
    </div>
  )
}
