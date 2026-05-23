// Horizontal scrolling tab strip showing completed (and currently-generating)
// lenses. Hidden when fewer than two lenses have been run.
// `generatingLensId` is optional — omit it on the read-only share page.

'use client'

import { LENSES } from '@/lib/lenses'
import type { MapResult } from '@/lib/reportTypes'
import { LensIcon } from '@/components/LensIcon'

export function LensTabs({
  activeLensId,
  maps,
  onSelect,
  generatingLensId = null,
}: {
  activeLensId: string
  maps: Record<string, MapResult>
  onSelect: (id: string) => void
  generatingLensId?: string | null
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
