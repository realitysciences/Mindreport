'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LENSES } from '@/lib/lenses'
import { buildShareUrl } from '@/lib/reportStorage'
import type { MapResult, TerrainSlice } from '@/lib/reportTypes'

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
    return JSON.parse(buffer.slice(resultIdx + RESULT_MARKER.length)) as MapResult
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

// ── Loading dots ──────────────────────────────────────────────────────────────

function LoadingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: color, opacity: 0.4, animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
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

// ── Lens tabs — only shows completed + generating, hidden when <2 ─────────────

function LensTabs({
  activeLensId, generatingLensId, maps, onSelect,
}: {
  activeLensId: string; generatingLensId: string | null
  maps: Record<string, MapResult>; onSelect: (id: string) => void
}) {
  const visible = LENSES.filter(l => maps[l.id] || l.id === generatingLensId)
  if (visible.length < 2) return null
  return (
    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '2rem', scrollbarWidth: 'none' }}>
      {visible.map(lens => {
        const isActive     = lens.id === activeLensId
        const isGenerating = lens.id === generatingLensId
        const c = lens.badgeColor
        return (
          <button
            key={lens.id}
            onClick={() => { if (!isGenerating && maps[lens.id]) onSelect(lens.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: '999px',
              background: isActive ? lens.iconBg : 'transparent',
              border: isActive ? `1.5px solid ${c}55` : `1px solid ${c}40`,
              color: c, fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              letterSpacing: '0.1em', cursor: isGenerating ? 'default' : 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              opacity: isGenerating ? 0.6 : 1, transition: 'opacity 0.15s, background 0.15s',
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

// ── Terrain overview (map legend) ─────────────────────────────────────────────

function TerrainOverview({ terrainMap, accentColor }: { terrainMap: TerrainSlice[]; accentColor: string }) {
  return (
    <div
      style={{
        marginBottom: '2.5rem',
        padding: '1.1rem 1.4rem',
        background: `${accentColor}05`,
        border: `1px solid ${accentColor}18`,
        borderRadius: '3px',
      }}
    >
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
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: isPrimary ? 700 : 400,
                color: isPrimary ? accentColor : 'var(--text-mid)',
              }}>
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
          {slice.markers?.length > 0 && (
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

// ── Export helpers ────────────────────────────────────────────────────────────

function buildExportText(result: MapResult, lensLabel: string): string {
  const divider = '─'.repeat(56)
  const date    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const sections = result.terrainMap
    .map((slice, i) => {
      const num     = String(i + 1).padStart(2, '0')
      const paras   = slice.body.split(/\n+/).map(p => p.trim()).filter(Boolean)
      const markers = slice.markers?.length ? `\nRecognition signals: ${slice.markers.join('  ·  ')}` : ''
      const prom    = slice.prominence === 'primary' ? ' [PRIMARY]' : ''
      return [
        `${num}. ${slice.label.toUpperCase()}${prom}`,
        `${slice.summary}`,
        '',
        paras.join('\n\n'),
        markers,
      ].filter(s => s !== undefined).join('\n')
    })
    .join(`\n\n${divider}\n\n`)

  const nowText        = result.nextMoveNow || result.nextMove || ''
  const structuralText = result.nextMoveStructural || ''

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
    ...(nowText ? ['NEXT MOVE — THIS WEEK', nowText, ''] : []),
    ...(structuralText ? ['NEXT MOVE — BUILD TOWARD', structuralText, ''] : []),
    divider,
    '',
    'Generated by Mind Report  ·  mindreport.com',
    'This map reflects patterns in your words, not a clinical assessment.',
    'Take what is useful. Leave what does not fit.',
  ].join('\n')
}

function buildAllExportText(maps: Record<string, MapResult>): string {
  const heavy    = '═'.repeat(56)
  const completed = LENSES.filter(l => maps[l.id])
  if (completed.length === 0) return ''
  if (completed.length === 1) return buildExportText(maps[completed[0].id], completed[0].label)
  const date   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const header = `MIND REPORT  ·  ${completed.length} LENSES  ·  ${date}\n${heavy}\n`
  return header + '\n\n' + completed.map(l => buildExportText(maps[l.id], l.label)).join(`\n\n${heavy}\n\n`)
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Escape HTML entities ──────────────────────────────────────────────────────

function escH(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Styled print HTML (mirrors the report UI) ─────────────────────────────────

function buildPrintHtml(maps: Record<string, MapResult>): string {
  const completedLenses = LENSES.filter(l => maps[l.id])
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Warm paper palette — used as real hex values (no CSS vars) for cross-window rendering
  const C = {
    bg:          '#F8F6F2',
    hi:          '#1C1917',
    body:        '#3D3A36',
    mid:         '#6B6560',
    faint:       '#9B9690',
    border:      '#E5E1DB',
    surface:     '#F1EDE7',
    surfaceDeep: '#EAE6E0',
  }

  const css = `
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { font-size: 15px; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: ${C.bg};
      color: ${C.body};
      line-height: 1.72;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 720px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }
    .card {
      background: #FFFFFF;
      border: 1px solid ${C.border};
      border-radius: 3px;
      padding: clamp(1.75rem, 5vw, 3rem);
      margin-bottom: 2rem;
    }
    /* ─ Card header ─ */
    .card-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid ${C.border};
    }
    .meta-eyebrow { font-family: 'Courier New', monospace; font-size: 7.5px; letter-spacing: .2em; text-transform: uppercase; color: ${C.faint}; margin-bottom: 4px; }
    .lens-name    { font-family: 'Courier New', monospace; font-size: 8.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: bold; }
    /* ─ Title / quote ─ */
    h1 { font-family: Georgia, serif; font-size: 30px; font-weight: bold; letter-spacing: -.025em; line-height: 1.12; color: ${C.hi}; margin-bottom: 1.25rem; }
    .quote-block { padding: 3px 0 3px 14px; margin-bottom: 2rem; }
    .quote-text  { font-style: italic; font-size: 18px; line-height: 1.45; color: ${C.hi}; }
    /* ─ Core pattern box ─ */
    .tinted-box { padding: .875rem 1.25rem; border-radius: 3px; margin-bottom: 2.5rem; }
    .section-kicker { font-family: 'Courier New', monospace; font-size: 7.5px; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 7px; }
    .body-text  { font-size: 13.5px; line-height: 1.75; }
    .body-text + .body-text { margin-top: .7rem; }
    /* ─ Terrain overview ─ */
    .terrain-overview { padding: .875rem 1.1rem; border-radius: 3px; margin-bottom: 2.5rem; }
    .terrain-overview-label { font-family: 'Courier New', monospace; font-size: 7px; letter-spacing: .18em; text-transform: uppercase; color: ${C.faint}; margin-bottom: 8px; }
    .terrain-chip { display: inline; font-family: 'Courier New', monospace; font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; }
    .terrain-chip-num { font-size: 7.5px; color: ${C.faint}; letter-spacing: .06em; margin-right: 3px; }
    .terrain-sep { color: ${C.border}; margin: 0 7px; }
    /* ─ Terrain sections ─ */
    .terrain-section { border-top: 1px solid ${C.border}; padding: 2rem 0 1.75rem; display: flex; gap: 1.25rem; align-items: flex-start; page-break-inside: avoid; }
    .chap-num { flex-shrink: 0; width: 2.75rem; text-align: right; font-family: Georgia, serif; font-size: 34px; font-weight: 800; line-height: 1; letter-spacing: -.04em; }
    .terrain-content { flex: 1; padding-top: 3px; }
    .terrain-label-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: .55rem; }
    .terrain-label { font-family: 'Courier New', monospace; font-size: 8.5px; letter-spacing: .16em; text-transform: uppercase; font-weight: bold; }
    .primary-badge { font-family: 'Courier New', monospace; font-size: 7px; letter-spacing: .12em; border-radius: 999px; padding: 2px 7px; font-weight: bold; }
    .terrain-summary { font-style: italic; font-size: 15px; color: ${C.hi}; line-height: 1.65; margin-bottom: .875rem; }
    .terrain-body   { font-size: 13.5px; color: ${C.body}; line-height: 1.78; }
    .terrain-body p+p { margin-top: .7rem; }
    .signals-label { font-family: 'Courier New', monospace; font-size: 7px; letter-spacing: .14em; text-transform: uppercase; color: ${C.faint}; margin-top: 1rem; margin-bottom: 6px; }
    .signals-row   { display: flex; flex-wrap: wrap; gap: 5px; }
    .signal-pill   { font-family: 'Courier New', monospace; font-size: 8.5px; letter-spacing: .03em; border-radius: 999px; padding: 3px 10px; }
    /* ─ Meta sections ─ */
    .meta-section { border-top: 1px solid ${C.border}; padding-top: 2rem; padding-bottom: 1.75rem; }
    .unseen-box   { padding: 1rem 1.25rem; border-radius: 3px; border-left: 3px solid; margin-bottom: 2rem; }
    .unseen-text  { font-style: italic; font-size: 13.5px; line-height: 1.75; }
    /* ─ Next moves grid ─ */
    .next-moves-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .next-move-card  { padding: 1rem 1.25rem; border-radius: 3px; }
    .next-move-label { font-family: 'Courier New', monospace; font-size: 7px; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 6px; }
    .next-move-text  { font-size: 13.5px; line-height: 1.7; }
    /* ─ Multi-lens divider ─ */
    .lens-divider { border: none; border-top: 2px solid ${C.border}; margin: 2.5rem 0; }
    /* ─ Footer ─ */
    .report-footer { font-family: 'Courier New', monospace; font-size: 7.5px; letter-spacing: .07em; color: ${C.faint}; text-align: center; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid ${C.border}; line-height: 1.9; }
    @media print {
      html { font-size: 13px; }
      body { background: white; }
      .card { box-shadow: none; border-color: #d8d4ce; }
      .terrain-section { page-break-inside: avoid; }
      .lens-report:not(:last-child) { page-break-after: always; }
    }
  `

  function renderLens(lensId: string): string {
    const lens   = LENSES.find(l => l.id === lensId)!
    const result = maps[lensId]
    const ac     = lens.badgeColor
    const nowText        = result.nextMoveNow || result.nextMove || ''
    const structuralText = result.nextMoveStructural || ''

    // Terrain overview
    const terrainOverview = (result.terrainMap?.length ?? 0) > 0 ? `
      <div class="terrain-overview" style="background:${ac}05;border:1px solid ${ac}18">
        <div class="terrain-overview-label">Terrain Map</div>
        <div>
          ${result.terrainMap.map((s, i) => {
            const prim = s.prominence === 'primary'
            return `<span class="terrain-chip">` +
              `<span class="terrain-chip-num">${String(i + 1).padStart(2, '0')}</span>` +
              `<span style="color:${prim ? ac : C.mid};font-weight:${prim ? '700' : '400'}">${escH(s.label)}</span>` +
              (i < result.terrainMap.length - 1 ? `<span class="terrain-sep">·</span>` : '') +
              `</span>`
          }).join('')}
        </div>
      </div>` : ''

    // Terrain sections
    const terrainSections = (result.terrainMap ?? []).map((slice, i) => {
      const prim  = slice.prominence === 'primary'
      const paras = slice.body.split(/\n+/).map(p => p.trim()).filter(Boolean)
      const markers = (slice.markers?.length ?? 0) > 0 ? `
        <div class="signals-label">Recognition signals</div>
        <div class="signals-row">
          ${slice.markers.map(m =>
            `<span class="signal-pill" style="color:${ac};background:${ac}12;border:1px solid ${ac}25">${escH(m)}</span>`
          ).join('')}
        </div>` : ''

      return `
        <div class="terrain-section">
          <div class="chap-num" style="color:${prim ? ac + '2A' : ac + '16'}">${String(i + 1).padStart(2, '0')}</div>
          <div class="terrain-content">
            <div class="terrain-label-row">
              <span class="terrain-label" style="color:${ac}">${escH(slice.label)}</span>
              ${prim ? `<span class="primary-badge" style="color:${ac};background:${ac}18;border:1px solid ${ac}35">PRIMARY</span>` : ''}
            </div>
            <div class="terrain-summary">${escH(slice.summary)}</div>
            <div class="terrain-body">${paras.map(p => `<p>${escH(p)}</p>`).join('')}</div>
            ${markers}
          </div>
        </div>`
    }).join('')

    // Hidden cost
    const hiddenCost = result.hiddenCost ? `
      <div class="meta-section">
        <div class="section-kicker" style="color:${C.faint}">Hidden Cost</div>
        <p class="body-text">${escH(result.hiddenCost)}</p>
      </div>` : ''

    // Unseen
    const unseen = result.unseen ? `
      <div class="unseen-box" style="background:${C.surfaceDeep};border-left-color:${ac}60">
        <div class="section-kicker" style="color:${ac}">What You May Not Have Noticed</div>
        <p class="unseen-text" style="color:${C.body}">${escH(result.unseen)}</p>
      </div>` : ''

    // Next moves
    const nextMoves = (nowText || structuralText) ? `
      <div class="meta-section">
        <div class="section-kicker" style="color:${C.faint}">Next Move</div>
        <div class="next-moves-grid">
          ${nowText ? `
            <div class="next-move-card" style="background:${ac}08;border:1px solid ${ac}22">
              <div class="next-move-label" style="color:${ac}">This week</div>
              <p class="next-move-text">${escH(nowText)}</p>
            </div>` : ''}
          ${structuralText ? `
            <div class="next-move-card" style="background:${C.surface};border:1px solid ${C.border}">
              <div class="next-move-label" style="color:${C.faint}">Build toward</div>
              <p class="next-move-text">${escH(structuralText)}</p>
            </div>` : ''}
        </div>
      </div>` : ''

    return `
      <div class="lens-report">
        <div class="card" style="border-top:3px solid ${ac}">
          <div class="card-header">
            <div>
              <div class="meta-eyebrow">Mind Report</div>
              <div class="lens-name" style="color:${ac}">${escH(lens.label)} Lens</div>
            </div>
            <div class="meta-eyebrow">${date}</div>
          </div>

          <h1>${escH(result.title)}</h1>

          <div class="quote-block" style="border-left:3px solid ${ac}">
            <div class="quote-text">&ldquo;${escH(result.quote)}&rdquo;</div>
          </div>

          <div class="tinted-box" style="background:${ac}08;border:1px solid ${ac}22">
            <div class="section-kicker" style="color:${ac}">Core Pattern</div>
            <p class="body-text">${escH(result.corePattern)}</p>
          </div>

          ${terrainOverview}
          ${terrainSections}
          ${hiddenCost}
          ${unseen}
          ${nextMoves}
        </div>
      </div>`
  }

  const lensHtml = completedLenses.length === 0
    ? '<p>No maps generated.</p>'
    : completedLenses.map(l => renderLens(l.id)).join('<hr class="lens-divider">')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mind Report</title>
  <style>${css}</style>
</head>
<body>
  <div class="page">
    ${lensHtml}
    <div class="report-footer">
      Generated by Mind Report &middot; mindreport.com &middot; ${date}<br>
      This map reflects patterns in your words, not a clinical assessment. Take what is useful. Leave what does not fit.
    </div>
  </div>
</body>
</html>`
}

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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: generatingLens.badgeColor, fontWeight: 600, letterSpacing: '0.08em' }}>
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {activeLens.label} lens
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: accentColor, letterSpacing: '0.08em', fontWeight: 600 }}>
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
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Mind Report
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <LensIcon id={activeLensId} color={accentColor} size={11} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: accentColor, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
                    {activeLens.label} Lens
                  </span>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.06em', textAlign: 'right' }}>
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
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: accentColor, letterSpacing: '0.12em', fontSize: '0.58rem' }}>
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
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.12em', fontSize: '0.58rem' }}>
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
