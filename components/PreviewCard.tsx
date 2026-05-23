// Shows a parsed document preview with filename, word count, expandable text,
// and a replace button.

'use client'

import { useState } from 'react'
import { fileIcon, methodLabel, type ParseResult } from '@/lib/parseDocument'

export function PreviewCard({
  result,
  onReplace,
}: {
  result:    ParseResult
  onReplace: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = result.text.slice(0, 600).trim()
  const hasMore = result.text.length > 600

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', overflow: 'hidden' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-sub)', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>{fileIcon(result.filename)}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
              {result.filename}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
              {methodLabel(result.method)} · ~{result.wordCount.toLocaleString()} words
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Green tick */}
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e20', border: '1px solid #22c55e50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            onClick={onReplace}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-faint)', background: 'none', border: '1px solid var(--border-ghost)', borderRadius: '999px', padding: '0.2rem 0.65rem', cursor: 'pointer' }}
          >
            Replace
          </button>
        </div>
      </div>

      {/* Text preview */}
      <div style={{ padding: '0.85rem 1rem' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-deck)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {expanded ? result.text.slice(0, 2000) : preview}
          {!expanded && hasMore && '…'}
        </p>
        {hasMore && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-faint)', background: 'none', border: 'none', padding: '0.5rem 0 0', cursor: 'pointer', display: 'block' }}
          >
            {expanded ? '▴ Show less' : '▾ Show more'}
          </button>
        )}
      </div>
    </div>
  )
}
