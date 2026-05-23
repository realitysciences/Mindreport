'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LENSES } from '@/lib/lenses'
import { decodeSharePayload, buildShareUrl } from '@/lib/reportStorage'
import { LensIcon } from '@/components/LensIcon'
import { LensTabs } from '@/components/LensTabs'
import { TerrainOverview } from '@/components/TerrainOverview'
import { TerrainSection } from '@/components/TerrainSection'
import type { MapResult } from '@/lib/reportTypes'

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShareMapPage() {
  const [maps, setMaps]               = useState<Record<string, MapResult> | null>(null)
  const [activeLensId, setActiveLensId] = useState('pattern')
  const [linkCopied, setLinkCopied]   = useState(false)
  const [invalid, setInvalid]         = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash === '#') { setInvalid(true); return }
    const encoded = hash.replace(/^#d=/, '').replace(/^#/, '')
    const decoded = decodeSharePayload(encoded)
    if (!decoded) { setInvalid(true); return }
    setMaps(decoded.maps)
    setActiveLensId(decoded.activeLensId)
  }, [])

  // ── Invalid / loading ──────────────────────────────────────────────────────

  if (invalid) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ minHeight: '70vh' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)', fontSize: '1.05rem', maxWidth: 380, lineHeight: 1.7 }}>
          This link doesn&apos;t contain a valid map. It may have been truncated when shared.
        </p>
        <Link href="/your-map" className="px-6 py-3 rounded-sm text-xs transition-opacity hover:opacity-70" style={{ border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-mid)', letterSpacing: '0.08em' }}>
          GET YOUR OWN MAP
        </Link>
      </div>
    )
  }

  if (!maps) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '70vh' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-faint)', opacity: 0.4, animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Report view ────────────────────────────────────────────────────────────

  const activeLens  = LENSES.find(l => l.id === activeLensId) ?? LENSES[0]
  const accentColor = activeLens.badgeColor
  const activeMap   = maps[activeLensId]
  if (!activeMap) return null

  const date           = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const nowText        = activeMap.nextMoveNow || activeMap.nextMove || ''
  const structuralText = activeMap.nextMoveStructural || ''

  const handleCopyLink = async () => {
    const url = buildShareUrl(maps, activeLensId)
    await navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  return (
    <div className="px-4 sm:px-6 py-12">
      <div className="mx-auto" style={{ maxWidth: '720px' }}>

        {/* Shared-map banner */}
        <div className="flex items-center justify-between mb-8 px-4 py-3 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
            Shared Mind Report
          </p>
          <Link href="/your-map" className="text-xs transition-opacity hover:opacity-70" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.08em' }}>
            Get your own map →
          </Link>
        </div>

        {/* Lens tabs */}
        <LensTabs activeLensId={activeLensId} maps={maps} onSelect={setActiveLensId} />

        {/* Document card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${accentColor}`, borderRadius: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.04)', padding: 'clamp(1.5rem, 5vw, 3.5rem)', marginBottom: '2.5rem' }}>

          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Mind Report</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <LensIcon id={activeLensId} color={accentColor} size={11} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: accentColor, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
                  {activeLens.label} Lens
                </span>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em', textAlign: 'right' }}>{date}</p>
          </div>

          {/* Title */}
          <h1 className="font-bold mb-5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', lineHeight: 1.12 }}>
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
            <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em' }}>Core Pattern</p>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.7 }}>{activeMap.corePattern}</p>
          </div>

          {/* Terrain overview */}
          {(activeMap.terrainMap?.length ?? 0) > 0 && (
            <TerrainOverview terrainMap={activeMap.terrainMap} accentColor={accentColor} />
          )}

          {/* Terrain sections */}
          <div>
            {activeMap.terrainMap?.map((slice, i) => (
              <TerrainSection key={i} slice={slice} index={i} accentColor={accentColor} />
            ))}
          </div>

          {/* Hidden Cost */}
          {activeMap.hiddenCost && (
            <div className="pt-10 pb-8" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.16em' }}>Hidden Cost</p>
              <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.75 }}>{activeMap.hiddenCost}</p>
            </div>
          )}

          {/* Unseen */}
          {activeMap.unseen && (
            <div className="mb-8 px-5 py-5 rounded-sm" style={{ background: 'var(--surface-deep, var(--surface))', border: `1px solid ${accentColor}20`, borderLeft: `3px solid ${accentColor}60` }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.16em', opacity: 0.85 }}>What You May Not Have Noticed</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.75 }}>{activeMap.unseen}</p>
            </div>
          )}

          {/* Next Moves */}
          {(nowText || structuralText) && (
            <div className="pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-widest mb-5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.16em' }}>Next Move</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {nowText && (
                  <div className="px-5 py-4 rounded-sm" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}22` }}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.12em', fontSize: '0.58rem' }}>This week</p>
                    <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7 }}>{nowText}</p>
                  </div>
                )}
                {structuralText && (
                  <div className="px-5 py-4 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.12em', fontSize: '0.58rem' }}>Build toward</p>
                    <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7 }}>{structuralText}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-6 mb-14">

          {/* Share + CTA */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-all hover:opacity-85"
              style={{ background: linkCopied ? `${accentColor}12` : 'var(--surface)', border: linkCopied ? `1px solid ${accentColor}35` : '1px solid var(--border)', color: linkCopied ? accentColor : 'var(--text-body)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', cursor: 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {linkCopied ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}
              </svg>
              {linkCopied ? 'LINK COPIED' : 'COPY LINK'}
            </button>
            <Link
              href="/your-map"
              className="flex items-center gap-2 px-5 py-3 rounded-sm text-xs transition-opacity hover:opacity-85"
              style={{ background: 'var(--accent-dark)', color: '#F0ECE4', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
            >
              GET YOUR OWN MAP →
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-xs" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-ghost)', lineHeight: 1.6 }}>
            This map reflects patterns in the words shared. It is not a clinical assessment. Take what is useful. Leave what does not fit.
          </p>
        </div>

      </div>
    </div>
  )
}
