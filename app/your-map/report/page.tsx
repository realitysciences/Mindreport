'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LENSES } from '@/lib/lenses'

// ── Types ─────────────────────────────────────────────────────────────────────

type TerrainSlice = {
  label: string
  summary: string
  body: string
  markers: string[]
}

type MapResult = {
  title: string
  quote: string
  terrainMap: TerrainSlice[]
  corePattern: string
  hiddenCost: string
  nextMove: string
}

type Phase = 'loading' | 'gate' | 'report' | 'error'

// Frame markers matching the streaming API
const RESULT_MARKER = "\n__MAP_RESULT__:"
const ERROR_MARKER  = "\n__MAP_ERROR__:"

// ── Loading animation ─────────────────────────────────────────────────────────

function LoadingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            opacity: 0.4,
            animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Lens icon ─────────────────────────────────────────────────────────────────

function LensIcon({ id, color, size = 18 }: { id: string; color: string; size?: number }) {
  const s = { width: size, height: size, stroke: color, fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'pattern':   return <svg viewBox="0 0 24 24" {...s}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
    case 'shadow':    return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18"/></svg>
    case 'desire':    return <svg viewBox="0 0 24 24" {...s}><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
    case 'relational':return <svg viewBox="0 0 24 24" {...s}><circle cx="9" cy="7" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6"/><path d="M19 15c1.66.55 3 1.92 3 3.5v1"/></svg>
    case 'origin':    return <svg viewBox="0 0 24 24" {...s}><path d="M12 22V12"/><path d="M12 12C12 7 8 3 3 3"/><path d="M12 12c0-5 4-9 9-9"/><path d="M3 3c3 3 5 6 5 9"/><path d="M21 3c-3 3-5 6-5 9"/></svg>
    case 'identity':  return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    default:          return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/></svg>
  }
}

// ── Terrain section ───────────────────────────────────────────────────────────

function TerrainSection({ slice, index, accentColor }: { slice: TerrainSlice; index: number; accentColor: string }) {
  const paragraphs = slice.body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  return (
    <div className="py-10" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{ height: '1px', width: 24, background: 'var(--border)' }} />
        <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>
          {slice.label}
        </span>
      </div>
      <p className="mb-6" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.15rem', lineHeight: 1.6 }}>
        {slice.summary}
      </p>
      <div className="flex flex-col gap-4 mb-6">
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1.05rem', lineHeight: 1.75 }}>
            {para}
          </p>
        ))}
      </div>
      {slice.markers?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slice.markers.map((marker, i) => (
            <span key={i} className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: accentColor, background: `${accentColor}12`, border: `1px solid ${accentColor}28`, borderRadius: '999px', padding: '0.2rem 0.65rem', letterSpacing: '0.04em' }}>
              {marker}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Export helpers ────────────────────────────────────────────────────────────

function buildExportText(result: MapResult, lensLabel: string): string {
  const divider = '─'.repeat(56)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const sections = result.terrainMap
    .map((slice, i) => {
      const num = String(i + 1).padStart(2, '0')
      const paras = slice.body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
      const markers = slice.markers?.length ? `\nMarkers: ${slice.markers.join('  ·  ')}` : ''
      return [
        `${num} — ${slice.label.toUpperCase()}`,
        `${slice.summary}`,
        '',
        paras.join('\n\n'),
        markers,
      ].filter((s) => s !== undefined).join('\n')
    })
    .join(`\n\n${divider}\n\n`)

  return [
    'MIND REPORT',
    `${result.title}`,
    `${lensLabel} Lens  ·  ${date}`,
    '',
    divider,
    '',
    `"${result.quote}"`,
    '',
    divider,
    '',
    'CORE PATTERN',
    result.corePattern,
    '',
    divider,
    '',
    sections,
    '',
    divider,
    '',
    'HIDDEN COST',
    result.hiddenCost,
    '',
    'NEXT MOVE',
    result.nextMove,
    '',
    divider,
    '',
    'Generated by Mind Report  ·  mindreport.com',
    'This map reflects patterns in your words, not a clinical assessment.',
    'Take what is useful. Leave what does not fit.',
  ].join('\n')
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [phase, setPhase]         = useState<Phase>('loading')
  const [mapResult, setMapResult] = useState<MapResult | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const [lensId, setLensId]       = useState('pattern')
  const [copied, setCopied]       = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const transcript = sessionStorage.getItem('mindreport_transcript') ?? ''
    const lens       = sessionStorage.getItem('mindreport_lens') ?? 'pattern'
    setLensId(lens)

    if (!transcript) {
      setErrorMsg('No transcript found. Please complete an interview first.')
      setPhase('error')
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/generate-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, lens }),
        })

        if (!res.body) throw new Error(`Server error (${res.status}). Please try again.`)

        // Read the streaming response
        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer    = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
        }

        // Extract the final payload using null-byte markers
        const resultIdx = buffer.indexOf(RESULT_MARKER)
        const errorIdx  = buffer.indexOf(ERROR_MARKER)

        if (resultIdx !== -1) {
          const jsonStr = buffer.slice(resultIdx + RESULT_MARKER.length)
          const data = JSON.parse(jsonStr) as MapResult
          setMapResult(data)
          setPhase('gate')
        } else if (errorIdx !== -1) {
          const msg = buffer.slice(errorIdx + ERROR_MARKER.length)
          throw new Error(msg || 'Generation failed.')
        } else {
          throw new Error('Map generation failed. Please try again.')
        }
      } catch (err) {
        const raw = (err as Error).message
        const msg = raw.includes('not valid JSON') || raw.includes('Unexpected token')
          ? 'Map generation failed. Please try again.'
          : raw
        setErrorMsg(msg)
        setPhase('error')
      }
    })()
  }, [])

  const activeLens  = LENSES.find((l) => l.id === lensId) ?? LENSES[0]
  const accentColor = activeLens.badgeColor

  const handleExportText = useCallback(() => {
    if (!mapResult) return
    const text = buildExportText(mapResult, activeLens.label)
    const slug = mapResult.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
    downloadText(text, `mind-report-${slug}.txt`)
  }, [mapResult, activeLens.label])

  const handleCopyLink = useCallback(async () => {
    if (!mapResult) return
    const text = buildExportText(mapResult, activeLens.label)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [mapResult, activeLens.label])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: '70vh' }}>
        <div className="flex items-center justify-center rounded-full mb-6" style={{ width: 64, height: 64, background: activeLens.iconBg, border: `1px solid ${accentColor}35` }}>
          <LensIcon id={lensId} color={accentColor} size={24} />
        </div>
        <p className="mb-5" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.1rem' }}>
          Drawing your map&hellip;
        </p>
        <LoadingDots color={accentColor} />
        <p className="mt-8 text-xs text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', maxWidth: 280, lineHeight: 1.6 }}>
          {activeLens.label} lens · This takes about 30 seconds
        </p>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6" style={{ minHeight: '70vh' }}>
        <p className="text-sm text-center" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)', maxWidth: 400 }}>
          {errorMsg || 'Something went wrong generating your map.'}
        </p>
        <Link href="/your-map/lens" className="px-6 py-3 rounded-sm text-xs transition-opacity hover:opacity-70" style={{ border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-mid)', letterSpacing: '0.08em' }}>
          ← BACK
        </Link>
      </div>
    )
  }

  // ── Gate ──────────────────────────────────────────────────────────────────

  if (phase === 'gate') {
    return (
      <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: '70vh' }}>
        <div className="flex items-center justify-center rounded-full mb-8" style={{ width: 64, height: 64, background: activeLens.iconBg, border: `1px solid ${accentColor}40` }}>
          <LensIcon id={lensId} color={accentColor} size={24} />
        </div>
        <h1 className="font-bold mb-5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', letterSpacing: '-0.02em' }}>
          Your map has been drawn.
        </h1>
        <p className="mb-10" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 460 }}>
          What follows is a cartographic read of the territory you described. It is not a diagnosis. It is not a verdict. It is one precise way of seeing what you shared.
        </p>
        <div className="flex flex-col items-center gap-3" style={{ width: '100%', maxWidth: 280 }}>
          <button onClick={() => setPhase('report')} className="w-full py-4 rounded-sm text-sm font-medium transition-opacity hover:opacity-85" style={{ background: 'var(--accent-dark)', color: '#F0ECE4', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
            READ YOUR MAP →
          </button>
          <Link href="/your-map/lens" className="w-full py-3 rounded-sm text-xs text-center transition-opacity hover:opacity-70" style={{ border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
            Not yet — go back
          </Link>
        </div>
      </div>
    )
  }

  // ── Report ────────────────────────────────────────────────────────────────

  if (phase === 'report' && mapResult) {
    return (
      <div className="px-6 py-14">
        <div className="mx-auto" style={{ maxWidth: '680px' }}>

          {/* Lens badge */}
          <div className="flex items-center gap-2 mb-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: activeLens.iconBg, border: `1px solid ${accentColor}35` }}>
              <LensIcon id={lensId} color={accentColor} size={13} />
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.14em', fontWeight: 600 }}>
                {activeLens.label} Lens
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-bold mb-6" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {mapResult.title}
          </h1>

          {/* Quote */}
          <div className="mb-8 pl-5 py-1" style={{ borderLeft: `3px solid ${accentColor}` }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-hi)', fontSize: 'clamp(1.3rem, 3vw, 1.65rem)', lineHeight: 1.4 }}>
              &ldquo;{mapResult.quote}&rdquo;
            </p>
          </div>

          {/* Core Pattern */}
          <div className="mb-12 px-5 py-4 rounded-sm" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}22` }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>
              Core Pattern
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.65 }}>
              {mapResult.corePattern}
            </p>
          </div>

          {/* Terrain sections */}
          <div>
            {mapResult.terrainMap?.map((slice, i) => (
              <TerrainSection key={i} slice={slice} index={i} accentColor={accentColor} />
            ))}
          </div>

          {/* Hidden Cost + Next Move */}
          <div className="mt-2 pt-10 grid gap-6 sm:grid-cols-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.16em' }}>Hidden Cost</p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>{mapResult.hiddenCost}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>Next Move</p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>{mapResult.nextMove}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-14 pt-10 flex flex-col gap-8" style={{ borderTop: '1px solid var(--border)' }}>

            {/* ReLoHu CTA */}
            <div className="px-6 py-6 rounded-sm flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}>Go deeper</span>
              <p className="font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.2rem' }}>This is a first reading.</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                A full cartographic commission from ReLoHu™ goes significantly deeper — a complete map of your psychological terrain, rendered as a document built to last.
              </p>
              <a href="https://www.relohu.com" target="_blank" rel="noopener noreferrer" className="self-start text-xs transition-opacity hover:opacity-70" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.08em' }}>
                Commission a full map at relohu.com →
              </a>
            </div>

            {/* Export / Actions */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
                Export your map
              </p>
              <div className="flex flex-wrap items-center gap-3">

                {/* Download .txt */}
                <button
                  onClick={handleExportText}
                  className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  DOWNLOAD .TXT
                </button>

                {/* Copy to clipboard */}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75"
                  style={{ border: '1px solid var(--border)', background: copied ? `${accentColor}10` : 'var(--surface)', color: copied ? accentColor : 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {copied
                      ? <><polyline points="20 6 9 17 4 12"/></>
                      : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
                    }
                  </svg>
                  {copied ? 'COPIED' : 'COPY TEXT'}
                </button>

                {/* Print / Save as PDF */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  SAVE AS PDF
                </button>

              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/your-map/lens" className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-70" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                ← CHANGE LENS
              </Link>
              <Link href="/your-map" className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-70" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                START OVER
              </Link>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-center" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-ghost)', lineHeight: 1.6 }}>
              This map is generated from what you shared. It reflects patterns in your words, not a clinical assessment. Take what is useful. Leave what does not fit.
            </p>

          </div>
        </div>
      </div>
    )
  }

  return null
}
