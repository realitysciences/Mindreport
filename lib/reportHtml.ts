// Styled HTML generator for PDF printing — mirrors the report UI.
// Uses hard-coded hex values (no CSS vars) so the output is self-contained
// when opened in a new window for printing.

import { LENSES } from '@/lib/lenses'
import type { MapResult } from '@/lib/reportTypes'

export function escH(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildPrintHtml(maps: Record<string, MapResult>): string {
  const completedLenses = LENSES.filter(l => maps[l.id])
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Warm paper palette — real hex values (no CSS vars) for cross-window rendering
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
    .terrain-section { border-top: 1px solid ${C.border}; padding: 2rem 0 1.75rem; display: flex; gap: 1.25rem; align-items: flex-start; }
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
      .signal-pill { page-break-inside: avoid; }
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
