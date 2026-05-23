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
  unseen?: string
  nextMove: string
}

type Phase = 'loading' | 'gate' | 'report' | 'error'

const RESULT_MARKER = "\nMINDREPORT_RESULT:"
const ERROR_MARKER  = "\nMINDREPORT_ERROR:"

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function fetchMap(transcript: string, lens: string, subject: string): Promise<MapResult> {
  const res = await fetch('/api/generate-map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, lens, subject }),
  })

  if (!res.body) throw new Error(`Server error (${res.status}). Please try again.`)

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
  }

  const resultIdx = buffer.indexOf(RESULT_MARKER)
  const errorIdx  = buffer.indexOf(ERROR_MARKER)

  if (resultIdx !== -1) {
    const jsonStr = buffer.slice(resultIdx + RESULT_MARKER.length)
    return JSON.parse(jsonStr) as MapResult
  } else if (errorIdx !== -1) {
    throw new Error(buffer.slice(errorIdx + ERROR_MARKER.length) || 'Generation failed.')
  } else {
    const escaped = buffer.slice(0, 80)
      .split('').map(c => c === '\n' ? '↵' : c === '\r' ? '↩' : c === ' ' ? '·' : c).join('')
    throw new Error(`No result marker. [${buffer.length}b] "${escaped}"`)
  }
}

function normalizeError(raw: string): string {
  return raw.includes('not valid JSON') || raw.includes('Unexpected token')
    ? 'Map generation failed. Please try again.'
    : raw
}

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
    case 'pattern':    return <svg viewBox="0 0 24 24" {...s}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
    case 'shadow':     return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18"/></svg>
    case 'desire':     return <svg viewBox="0 0 24 24" {...s}><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
    case 'relational': return <svg viewBox="0 0 24 24" {...s}><circle cx="9" cy="7" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6"/><path d="M19 15c1.66.55 3 1.92 3 3.5v1"/></svg>
    case 'origin':     return <svg viewBox="0 0 24 24" {...s}><path d="M12 22V12"/><path d="M12 12C12 7 8 3 3 3"/><path d="M12 12c0-5 4-9 9-9"/><path d="M3 3c3 3 5 6 5 9"/><path d="M21 3c-3 3-5 6-5 9"/></svg>
    case 'identity':   return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    default:           return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/></svg>
  }
}

// ── Lens tabs — only shows completed + currently generating, hidden when <2 ───

function LensTabs({
  activeLensId,
  generatingLensId,
  maps,
  onSelect,
}: {
  activeLensId: string
  generatingLensId: string | null
  maps: Record<string, MapResult>
  onSelect: (id: string) => void
}) {
  const visible = LENSES.filter(l => maps[l.id] || l.id === generatingLensId)
  if (visible.length < 2) return null

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        marginBottom: '2.5rem',
        scrollbarWidth: 'none',
      }}
    >
      {visible.map(lens => {
        const isActive     = lens.id === activeLensId
        const isGenerating = lens.id === generatingLensId
        const c = lens.badgeColor

        return (
          <button
            key={lens.id}
            onClick={() => { if (!isGenerating && maps[lens.id]) onSelect(lens.id) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: isActive ? lens.iconBg : 'transparent',
              border: isActive ? `1.5px solid ${c}55` : `1px solid ${c}40`,
              color: c,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              cursor: isGenerating ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              opacity: isGenerating ? 0.6 : 1,
              transition: 'opacity 0.15s, background 0.15s',
            }}
          >
            <LensIcon id={lens.id} color={c} size={11} />
            {lens.label.toUpperCase()}
            {isGenerating
              ? <span style={{ marginLeft: '0.15rem', animation: 'pulse 1.4s ease-in-out infinite' }}>···</span>
              : !isActive && <span style={{ marginLeft: '0.1rem', opacity: 0.5, fontSize: '0.6rem' }}>✓</span>
            }
          </button>
        )
      })}
    </div>
  )
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
        `${num}. ${slice.label.toUpperCase()}`,
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
    ...(result.unseen ? ['WHAT YOU MAY NOT HAVE NOTICED', result.unseen, ''] : []),
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

// Combines ALL completed lens reports into a single export
function buildAllExportText(maps: Record<string, MapResult>): string {
  const heavy = '═'.repeat(56)
  const completed = LENSES.filter(l => maps[l.id])
  if (completed.length === 0) return ''
  if (completed.length === 1) return buildExportText(maps[completed[0].id], completed[0].label)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const header = `MIND REPORT  ·  ${completed.length} LENSES  ·  ${date}\n${heavy}\n`
  return header + '\n\n' + completed.map(l => buildExportText(maps[l.id], l.label)).join(`\n\n${heavy}\n\n`)
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

// ── Run another lens ──────────────────────────────────────────────────────────

function RunAnotherLens({
  maps,
  generatingLensId,
  lensError,
  onRun,
}: {
  maps: Record<string, MapResult>
  generatingLensId: string | null
  lensError: string
  onRun: (id: string) => void
}) {
  const remaining     = LENSES.filter(l => !maps[l.id] && l.id !== generatingLensId)
  const generatingLens = generatingLensId ? LENSES.find(l => l.id === generatingLensId) : null

  if (remaining.length === 0 && !generatingLensId) return null

  return (
    <div className="pt-10" style={{ borderTop: '1px solid var(--border)' }}>
      <p
        className="text-xs uppercase tracking-widest mb-6"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}
      >
        Run another lens
      </p>

      {/* Active generation indicator */}
      {generatingLens && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-sm mb-5"
          style={{ background: generatingLens.iconBg, border: `1px solid ${generatingLens.badgeColor}30` }}
        >
          <LensIcon id={generatingLens.id} color={generatingLens.badgeColor} size={15} />
          <span
            className="text-xs flex-1"
            style={{ fontFamily: 'var(--font-mono)', color: generatingLens.badgeColor, letterSpacing: '0.08em' }}
          >
            Drawing {generatingLens.label} map
          </span>
          <LoadingDots color={generatingLens.badgeColor} />
        </div>
      )}

      {/* Remaining lenses grid */}
      {remaining.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {remaining.map(lens => (
            <button
              key={lens.id}
              onClick={() => !generatingLensId && onRun(lens.id)}
              className="text-left"
              disabled={!!generatingLensId}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '1rem',
                cursor: generatingLensId ? 'default' : 'pointer',
                opacity: generatingLensId ? 0.45 : 1,
                transition: 'opacity 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { if (!generatingLensId) (e.currentTarget as HTMLElement).style.borderColor = `${lens.badgeColor}60` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: lens.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.65rem',
                }}
              >
                <LensIcon id={lens.id} color={lens.iconColor} size={14} />
              </div>
              <div
                className="text-sm font-medium mb-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)' }}
              >
                {lens.label}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-mid)', lineHeight: 1.5 }}
              >
                {lens.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {lensError && (
        <p className="mt-4 text-xs" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#D4537E' }}>
          {lensError} - tap a lens above to try again.
        </p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [phase, setPhase]                       = useState<Phase>('loading')
  const [maps, setMaps]                         = useState<Record<string, MapResult>>({})
  const [activeLensId, setActiveLensId]         = useState('pattern')
  const [generatingLensId, setGeneratingLensId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]                 = useState('')
  const [lensError, setLensError]               = useState('')
  const [copied, setCopied]                     = useState(false)
  const hasFetched    = useRef(false)
  const transcriptRef = useRef('')
  const subjectRef    = useRef('the person')

  // Initial load: read transcript + first lens + subject from sessionStorage
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const transcript = sessionStorage.getItem('mindreport_transcript') ?? ''
    const lens       = sessionStorage.getItem('mindreport_lens') ?? 'pattern'
    const subject    = sessionStorage.getItem('mindreport_subject') ?? 'the person'

    setActiveLensId(lens)
    transcriptRef.current = transcript
    subjectRef.current    = subject

    if (!transcript) {
      setErrorMsg('No transcript found. Please complete an interview first.')
      setPhase('error')
      return
    }

    ;(async () => {
      try {
        const data = await fetchMap(transcript, lens, subject)
        setMaps({ [lens]: data })
        setPhase('gate')
      } catch (err) {
        setErrorMsg(normalizeError((err as Error).message))
        setPhase('error')
      }
    })()
  }, [])

  // Switch to an already-completed lens (from tab click)
  const handleSelectLens = useCallback((targetId: string) => {
    if (maps[targetId]) setActiveLensId(targetId)
  }, [maps])

  // Generate a new lens (from "Run another lens" cards at the bottom)
  const handleRunLens = useCallback(async (targetId: string) => {
    if (maps[targetId] || generatingLensId !== null) return
    setLensError('')
    setGeneratingLensId(targetId)
    try {
      const data = await fetchMap(transcriptRef.current, targetId, subjectRef.current)
      setMaps(prev => ({ ...prev, [targetId]: data }))
      setActiveLensId(targetId)
    } catch (err) {
      setLensError(normalizeError((err as Error).message))
    } finally {
      setGeneratingLensId(null)
    }
  }, [maps, generatingLensId])

  const activeLens  = LENSES.find((l) => l.id === activeLensId) ?? LENSES[0]
  const accentColor = activeLens.badgeColor
  const activeMap   = maps[activeLensId] ?? null

  const handleExportText = useCallback(() => {
    const text = buildAllExportText(maps)
    if (!text) return
    const firstMap  = maps[Object.keys(maps)[0]]
    const slug      = firstMap?.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 36) ?? 'report'
    const d         = new Date()
    const stamp     = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const lensTag   = Object.keys(maps).length > 1 ? 'all-lenses' : activeLensId
    downloadText(text, `mind-report-${slug}-${lensTag}-${stamp}.txt`)
  }, [maps, activeLensId])

  const handleCopyText = useCallback(async () => {
    const text = buildAllExportText(maps)
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [maps])

  const handlePrint = useCallback(() => {
    const text = buildAllExportText(maps)
    if (!text) return
    const win = window.open('', '_blank')
    if (!win) { window.print(); return }
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    win.document.write(
      `<!DOCTYPE html><html><head><title>Mind Report</title>` +
      `<style>body{font-family:Georgia,'Times New Roman',serif;max-width:680px;margin:2.5rem auto;` +
      `padding:0 1.5rem;color:#1a1a1a;line-height:1.8;font-size:15px}` +
      `pre{white-space:pre-wrap;font-family:inherit;margin:0}` +
      `@media print{body{margin:1rem;padding:0}}</style></head>` +
      `<body><pre>${escaped}</pre></body></html>`
    )
    win.document.close()
    setTimeout(() => { win.print() }, 150)
  }, [maps])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: '70vh' }}>
        <div className="flex items-center justify-center rounded-full mb-6" style={{ width: 64, height: 64, background: activeLens.iconBg, border: `1px solid ${accentColor}35` }}>
          <LensIcon id={activeLensId} color={accentColor} size={24} />
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
          <LensIcon id={activeLensId} color={accentColor} size={24} />
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
            Not yet, go back
          </Link>
        </div>
      </div>
    )
  }

  // ── Report ────────────────────────────────────────────────────────────────

  if (phase === 'report' && activeMap) {
    return (
      <div className="px-6 py-14">
        <div className="mx-auto" style={{ maxWidth: '680px' }}>

          {/* Lens tabs - only visible when 2+ lenses are completed/generating */}
          <LensTabs
            activeLensId={activeLensId}
            generatingLensId={generatingLensId}
            maps={maps}
            onSelect={handleSelectLens}
          />

          {/* Lens badge */}
          <div className="flex items-center gap-2 mb-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: activeLens.iconBg, border: `1px solid ${accentColor}35` }}>
              <LensIcon id={activeLensId} color={accentColor} size={13} />
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.14em', fontWeight: 600 }}>
                {activeLens.label} Lens
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-bold mb-6" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {activeMap.title}
          </h1>

          {/* Quote */}
          <div className="mb-8 pl-5 py-1" style={{ borderLeft: `3px solid ${accentColor}` }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-hi)', fontSize: 'clamp(1.3rem, 3vw, 1.65rem)', lineHeight: 1.4 }}>
              &ldquo;{activeMap.quote}&rdquo;
            </p>
          </div>

          {/* Core Pattern */}
          <div className="mb-12 px-5 py-4 rounded-sm" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}22` }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>
              Core Pattern
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.65 }}>
              {activeMap.corePattern}
            </p>
          </div>

          {/* Terrain sections */}
          <div>
            {activeMap.terrainMap?.map((slice, i) => (
              <TerrainSection key={`${activeLensId}-${i}`} slice={slice} index={i} accentColor={accentColor} />
            ))}
          </div>

          {/* Hidden Cost + Next Move */}
          <div className="mt-2 pt-10 grid gap-6 sm:grid-cols-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.16em' }}>Hidden Cost</p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>{activeMap.hiddenCost}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>Next Move</p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>{activeMap.nextMove}</p>
            </div>
          </div>

          {/* Unseen */}
          {activeMap.unseen && (
            <div className="mt-8 px-5 py-5 rounded-sm" style={{ background: 'var(--surface-deep, var(--surface))', border: `1px solid ${accentColor}20`, borderLeft: `3px solid ${accentColor}60` }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em', opacity: 0.8 }}>
                What You May Not Have Noticed
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>
                {activeMap.unseen}
              </p>
            </div>
          )}

          {/* Run another lens */}
          <div className="mt-14">
            <RunAnotherLens
              maps={maps}
              generatingLensId={generatingLensId}
              lensError={lensError}
              onRun={handleRunLens}
            />
          </div>

          {/* Footer */}
          <div className="mt-14 pt-10 flex flex-col gap-8" style={{ borderTop: '1px solid var(--border)' }}>

            {/* ReLoHu CTA */}
            <div className="px-6 py-6 rounded-sm flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}>Go deeper</span>
              <p className="font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.2rem' }}>This is a first reading.</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                A full cartographic commission from ReLoHu&trade; goes significantly deeper. A complete map of your psychological terrain, rendered as a document built to last.
              </p>
              <a href="https://www.relohu.com" target="_blank" rel="noopener noreferrer" className="self-start text-xs transition-opacity hover:opacity-70" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.08em' }}>
                Commission a full map at relohu.com →
              </a>
            </div>

            {/* Export / Actions */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
                Export {Object.keys(maps).length > 1 ? `all ${Object.keys(maps).length} lens reports` : 'your map'}
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
                  onClick={handleCopyText}
                  className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75"
                  style={{ border: '1px solid var(--border)', background: copied ? `${accentColor}10` : 'var(--surface)', color: copied ? accentColor : 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {copied
                      ? <polyline points="20 6 9 17 4 12"/>
                      : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
                    }
                  </svg>
                  {copied ? 'COPIED' : 'COPY TEXT'}
                </button>

                {/* Save as PDF */}
                <button
                  onClick={handlePrint}
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
