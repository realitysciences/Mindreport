'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LENSES } from '@/lib/lenses'
import { decodeSharePayload, buildShareUrl } from '@/lib/reportStorage'
import type { MapResult, TerrainSlice } from '@/lib/reportTypes'

// ── Helpers ───────────────────────────────────────────────────────────────────

function escH(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Terrain overview ──────────────────────────────────────────────────────────

function TerrainOverview({ terrainMap, accentColor }: { terrainMap: TerrainSlice[]; accentColor: string }) {
  return (
    <div style={{ marginBottom: '2.5rem', padding: '1.1rem 1.4rem', background: `${accentColor}05`, border: `1px solid ${accentColor}18`, borderRadius: '3px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Terrain Map
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '0.45rem', columnGap: '0' }}>
        {terrainMap.map((slice, i) => {
          const isPrimary = slice.prominence === 'primary'
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: isPrimary ? 700 : 400, color: isPrimary ? accentColor : 'var(--text-mid)' }}>
                {slice.label}
              </span>
              {i < terrainMap.length - 1 && (
                <span style={{ color: 'var(--border)', margin: '0 0.3rem', fontSize: '0.65rem' }}>·</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Terrain section ───────────────────────────────────────────────────────────

function TerrainSection({ slice, index, accentColor }: { slice: TerrainSlice; index: number; accentColor: string }) {
  const paragraphs = slice.body.split(/\n+/).map(p => p.trim()).filter(Boolean)
  const isPrimary  = slice.prominence === 'primary'
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, width: '3.25rem', textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.75rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none', color: isPrimary ? `${accentColor}28` : `${accentColor}14` }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div style={{ flex: 1, paddingTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: accentColor, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
              {slice.label}
            </span>
            {isPrimary && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', letterSpacing: '0.12em', color: accentColor, background: `${accentColor}18`, border: `1px solid ${accentColor}35`, borderRadius: '999px', padding: '0.08rem 0.45rem', fontWeight: 700 }}>
                PRIMARY
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.1rem' }}>
            {slice.summary}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.78 }}>{para}</p>
            ))}
          </div>
          {(slice.markers?.length ?? 0) > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '0.5rem' }}>
                Recognition signals
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {slice.markers.map((m, i) => (
                  <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: accentColor, background: `${accentColor}10`, border: `1px solid ${accentColor}22`, borderRadius: '999px', padding: '0.22rem 0.7rem', letterSpacing: '0.03em' }}>
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

// ── Lens tabs ─────────────────────────────────────────────────────────────────

function LensTabs({ activeLensId, maps, onSelect }: { activeLensId: string; maps: Record<string, MapResult>; onSelect: (id: string) => void }) {
  const visible = LENSES.filter(l => maps[l.id])
  if (visible.length < 2) return null
  return (
    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '2rem', scrollbarWidth: 'none' }}>
      {visible.map(lens => {
        const isActive = lens.id === activeLensId
        const c = lens.badgeColor
        return (
          <button key={lens.id} onClick={() => onSelect(lens.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: isActive ? lens.iconBg : 'transparent', border: isActive ? `1.5px solid ${c}55` : `1px solid ${c}40`, color: c, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <LensIcon id={lens.id} color={c} size={11} />
            {lens.label.toUpperCase()}
            {!isActive && <span style={{ marginLeft: '0.1rem', opacity: 0.5, fontSize: '0.6rem' }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

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
