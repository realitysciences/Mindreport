'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LENSES } from '@/lib/lenses'
import { buildShareUrl } from '@/lib/reportStorage'
import { buildExportText, buildAllExportText, downloadText } from '@/lib/reportExport'
import { buildPrintHtml } from '@/lib/reportHtml'
import { fetchMap, normalizeError } from '@/lib/generateMap'
import { getReportSession } from '@/lib/reportSession'
import { LensIcon } from '@/components/LensIcon'
import { LensTabs } from '@/components/LensTabs'
import { TerrainOverview } from '@/components/TerrainOverview'
import { TerrainSection } from '@/components/TerrainSection'
import type { MapResult } from '@/lib/reportTypes'

type Phase = 'loading' | 'gate' | 'report' | 'error'

// ── Run another lens ──────────────────────────────────────────────────────────

function RunAnotherLens({
  maps, generatingLensId, lensError, lensPct, onRun,
}: {
  maps: Record<string, MapResult>; generatingLensId: string | null
  lensError: string; lensPct: number; onRun: (id: string) => void
}) {
  const remaining      = LENSES.filter(l => !maps[l.id] && l.id !== generatingLensId)
  const generatingLens = generatingLensId ? LENSES.find(l => l.id === generatingLensId) : null

  if (remaining.length === 0 && !generatingLensId) return null

  return (
    <div className="pt-10" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-xs uppercase tracking-widest mb-6" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
        Run another lens
      </p>

      {generatingLens && (
        <div className="px-5 py-4 rounded-sm mb-5" style={{ background: generatingLens.iconBg, border: `1px solid ${generatingLens.badgeColor}30` }}>
          <div className="flex items-center gap-3 mb-3">
            <LensIcon id={generatingLens.id} color={generatingLens.badgeColor} size={15} />
            <span className="text-xs flex-1" style={{ fontFamily: 'var(--font-mono)', color: generatingLens.badgeColor, letterSpacing: '0.08em' }}>
              Drawing {generatingLens.label} map
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: generatingLens.badgeColor, fontWeight: 600, letterSpacing: '0.08em' }}>
              {lensPct}%
            </span>
          </div>
          <div style={{ height: '2px', background: `${generatingLens.badgeColor}25`, borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${lensPct}%`,
              background: generatingLens.badgeColor,
              borderRadius: '999px',
              transition: 'width 0.25s ease',
            }} />
          </div>
        </div>
      )}

      {remaining.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {remaining.map(lens => (
            <button
              key={lens.id}
              onClick={() => !generatingLensId && onRun(lens.id)}
              disabled={!!generatingLensId}
              className="text-left"
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '1rem',
                cursor: generatingLensId ? 'default' : 'pointer',
                opacity: generatingLensId ? 0.45 : 1,
                transition: 'opacity 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { if (!generatingLensId) (e.currentTarget as HTMLElement).style.borderColor = `${lens.badgeColor}60` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: lens.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.65rem' }}>
                <LensIcon id={lens.id} color={lens.iconColor} size={14} />
              </div>
              <div className="text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)' }}>{lens.label}</div>
              <div className="text-xs leading-relaxed" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-mid)', lineHeight: 1.5 }}>{lens.description}</div>
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
  const [linkCopied, setLinkCopied]             = useState(false)
  const [email, setEmail]                       = useState('')
  const [emailSent, setEmailSent]               = useState(false)
  const [emailSending, setEmailSending]         = useState(false)
  const [emailError, setEmailError]             = useState('')
  const [loadPct, setLoadPct]                   = useState(0)
  const [lensPct, setLensPct]                   = useState(0)
  const hasFetched    = useRef(false)
  const transcriptRef = useRef('')
  const subjectRef    = useRef('the person')

  // ── Progress bar animation ─────────────────────────────────────────────────
  // Time-based ease-out: fast start, slows near 90%, snaps to 100% on completion.
  // Expected generation time ~30s with max_tokens:3500.
  const calcPct = (startMs: number) => {
    const t = Math.min((Date.now() - startMs) / 30_000, 1)
    return Math.min(89, Math.round(100 * (1 - Math.pow(1 - t, 2.4))))
  }

  // Initial load progress
  useEffect(() => {
    if (phase !== 'loading') {
      if (phase === 'gate' || phase === 'report') setLoadPct(100)
      return
    }
    setLoadPct(0)
    const start = Date.now()
    const id = setInterval(() => setLoadPct(calcPct(start)), 200)
    return () => clearInterval(id)
  }, [phase])

  // Additional-lens progress
  useEffect(() => {
    if (!generatingLensId) { setLensPct(0); return }
    setLensPct(0)
    const start = Date.now()
    const id = setInterval(() => setLensPct(calcPct(start)), 200)
    return () => clearInterval(id)
  }, [generatingLensId])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const { transcript, lens, subject } = getReportSession()

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

  const handleSelectLens = useCallback((targetId: string) => {
    if (maps[targetId]) setActiveLensId(targetId)
  }, [maps])

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

  const activeLens  = LENSES.find(l => l.id === activeLensId) ?? LENSES[0]
  const accentColor = activeLens.badgeColor
  const activeMap   = maps[activeLensId] ?? null

  const handleExportText = useCallback(() => {
    const text = buildAllExportText(maps)
    if (!text) return
    const first  = maps[Object.keys(maps)[0]]
    const slug   = first?.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 36) ?? 'report'
    const d      = new Date()
    const stamp  = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const tag    = Object.keys(maps).length > 1 ? 'all-lenses' : activeLensId
    downloadText(text, `mind-report-${slug}-${tag}-${stamp}.txt`)
  }, [maps, activeLensId])

  const handleCopyText = useCallback(async () => {
    const text = buildAllExportText(maps)
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [maps])

  const handlePrint = useCallback(() => {
    if (Object.keys(maps).length === 0) return
    const win = window.open('', '_blank')
    if (!win) { window.print(); return }
    win.document.write(buildPrintHtml(maps))
    win.document.close()
    setTimeout(() => win.print(), 300)
  }, [maps])

  const handleShare = useCallback(async () => {
    if (Object.keys(maps).length === 0) return
    const url = buildShareUrl(maps, activeLensId)
    await navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }, [maps, activeLensId])

  const handleEmailSend = useCallback(async () => {
    if (!email || emailSending || Object.keys(maps).length === 0) return
    setEmailSending(true)
    setEmailError('')
    try {
      const shareUrl  = buildShareUrl(maps, activeLensId)
      const activeMap = maps[activeLensId]
      const res = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          shareUrl,
          title: activeMap?.title ?? 'Your Mind Report',
          lensLabel: LENSES.find(l => l.id === activeLensId)?.label ?? activeLensId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setEmailSent(true)
    } catch (err) {
      setEmailError((err as Error).message)
    } finally {
      setEmailSending(false)
    }
  }, [email, emailSending, maps, activeLensId])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: '70vh' }}>
        <div className="flex items-center justify-center rounded-full mb-8" style={{ width: 64, height: 64, background: activeLens.iconBg, border: `1px solid ${accentColor}35` }}>
          <LensIcon id={activeLensId} color={accentColor} size={24} />
        </div>
        <p className="mb-8" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.1rem' }}>
          Drawing your map&hellip;
        </p>
        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {activeLens.label} lens
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: accentColor, letterSpacing: '0.08em', fontWeight: 600 }}>
              {loadPct}%
            </span>
          </div>
          <div style={{ height: '2px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${loadPct}%`,
              background: accentColor,
              borderRadius: '999px',
              transition: 'width 0.25s ease',
            }} />
          </div>
        </div>
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
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const nowText        = activeMap.nextMoveNow || activeMap.nextMove || ''
    const structuralText = activeMap.nextMoveStructural || ''

    return (
      <div className="px-4 sm:px-6 py-12">
        <div className="mx-auto" style={{ maxWidth: '720px' }}>

          {/* Lens tabs */}
          <LensTabs activeLensId={activeLensId} generatingLensId={generatingLensId} maps={maps} onSelect={handleSelectLens} />

          {/* ── Document card ────────────────────────────────────────────── */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderTop: `3px solid ${accentColor}`,
              borderRadius: '3px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.04)',
              padding: 'clamp(1.5rem, 5vw, 3.5rem)',
              marginBottom: '2.5rem',
            }}
          >
            {/* Document header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2.5rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Mind Report
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <LensIcon id={activeLensId} color={accentColor} size={11} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: accentColor, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
                    {activeLens.label} Lens
                  </span>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.06em', textAlign: 'right' }}>
                {date}
              </p>
            </div>

            {/* Title */}
            <h1
              className="font-bold mb-5"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', lineHeight: 1.12 }}
            >
              {activeMap.title}
            </h1>

            {/* Quote */}
            <div className="mb-10 pl-5 py-1" style={{ borderLeft: `3px solid ${accentColor}` }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-hi)', fontSize: 'clamp(1.2rem, 3vw, 1.55rem)', lineHeight: 1.45 }}>
                &ldquo;{activeMap.quote}&rdquo;
              </p>
            </div>

            {/* Core Pattern */}
            <div className="mb-12 px-5 py-4 rounded-sm" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}22` }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>
                Core Pattern
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>
                {activeMap.corePattern}
              </p>
            </div>

            {/* Terrain overview legend */}
            {activeMap.terrainMap?.length > 0 && (
              <TerrainOverview terrainMap={activeMap.terrainMap} accentColor={accentColor} />
            )}

            {/* Terrain sections */}
            <div>
              {activeMap.terrainMap?.map((slice, i) => (
                <TerrainSection key={`${activeLensId}-${i}`} slice={slice} index={i} accentColor={accentColor} />
              ))}
            </div>

            {/* Hidden Cost */}
            <div className="pt-10 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.16em' }}>
                Hidden Cost
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.75 }}>
                {activeMap.hiddenCost}
              </p>
            </div>

            {/* Unseen */}
            {activeMap.unseen && (
              <div
                className="mb-8 px-5 py-5 rounded-sm"
                style={{ background: 'var(--surface-deep, var(--surface))', border: `1px solid ${accentColor}20`, borderLeft: `3px solid ${accentColor}60` }}
              >
                <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em', opacity: 0.85 }}>
                  What You May Not Have Noticed
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.75 }}>
                  {activeMap.unseen}
                </p>
              </div>
            )}

            {/* Next Moves — tiered */}
            {(nowText || structuralText) && (
              <div className="pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-widest mb-5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.16em' }}>
                  Next Move
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {nowText && (
                    <div
                      className="px-5 py-4 rounded-sm"
                      style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}22` }}
                    >
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.12em', fontSize: '0.72rem' }}>
                        This week
                      </p>
                      <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        {nowText}
                      </p>
                    </div>
                  )}
                  {structuralText && (
                    <div
                      className="px-5 py-4 rounded-sm"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.12em', fontSize: '0.72rem' }}>
                        Build toward
                      </p>
                      <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        {structuralText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
          {/* ── End document card ────────────────────────────────────────── */}

          {/* Run another lens */}
          <div className="mb-14">
            <RunAnotherLens maps={maps} generatingLensId={generatingLensId} lensError={lensError} lensPct={lensPct} onRun={handleRunLens} />
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-8">

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

            {/* Share link */}
            <div className="px-5 py-5 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
                Share your map
              </p>
              <p className="text-xs mb-4" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)', lineHeight: 1.5 }}>
                Creates a private link. Anyone with the link can read your map — your transcript is never stored on our servers.
              </p>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-all hover:opacity-85"
                style={{
                  background: linkCopied ? `${accentColor}12` : 'var(--accent-dark)',
                  color: linkCopied ? accentColor : '#F0ECE4',
                  border: linkCopied ? `1px solid ${accentColor}35` : 'none',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {linkCopied
                    ? <polyline points="20 6 9 17 4 12"/>
                    : <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>
                  }
                </svg>
                {linkCopied ? 'LINK COPIED' : 'COPY SHARE LINK'}
              </button>
            </div>

            {/* Email delivery */}
            <div className="px-5 py-5 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
                Send to email
              </p>
              <p className="text-xs mb-4" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)', lineHeight: 1.5 }}>
                Get a link to your report in your inbox.
              </p>
              {emailSent ? (
                <p className="text-sm flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: accentColor }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Sent. Check your inbox.
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSend()}
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-sm text-sm"
                    style={{
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--text-body)', fontFamily: 'var(--font-serif)',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleEmailSend}
                    disabled={emailSending || !email}
                    className="flex-shrink-0 px-5 py-2.5 rounded-sm text-xs transition-opacity hover:opacity-85"
                    style={{
                      background: 'var(--accent-dark)', color: '#F0ECE4',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                      cursor: emailSending || !email ? 'default' : 'pointer',
                      opacity: emailSending || !email ? 0.5 : 1, border: 'none',
                    }}
                  >
                    {emailSending ? '...' : 'SEND'}
                  </button>
                </div>
              )}
              {emailError && (
                <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#D4537E' }}>
                  {emailError}
                </p>
              )}
            </div>

            {/* Export */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
                Export {Object.keys(maps).length > 1 ? `all ${Object.keys(maps).length} lens reports` : 'your map'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={handleExportText} className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  DOWNLOAD .TXT
                </button>
                <button onClick={handleCopyText} className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75" style={{ border: '1px solid var(--border)', background: copied ? `${accentColor}10` : 'var(--surface)', color: copied ? accentColor : 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {copied ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                  </svg>
                  {copied ? 'COPIED' : 'COPY TEXT'}
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-75" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer' }}>
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
