'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LENSES, type Lens } from '@/lib/lenses'

type Suggestion = { id: string; reason: string }

// ── Icons per lens ────────────────────────────────────────────────────────────

function LensIcon({ id, color }: { id: string; color: string }) {
  const s = { width: 18, height: 18, stroke: color, fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'pattern':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
    case 'shadow':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18"/></svg>
    case 'desire':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/></svg>
    case 'relational':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="9" cy="7" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6"/><path d="M19 15c1.66.55 3 1.92 3 3.5v1"/></svg>
    case 'origin':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 22V12"/><path d="M12 12C12 7 8 3 3 3"/><path d="M12 12c0-5 4-9 9-9"/><path d="M3 3c3 3 5 6 5 9"/><path d="M21 3c-3 3-5 6-5 9"/></svg>
    case 'identity':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    default:
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/></svg>
  }
}

// ── Lens card ─────────────────────────────────────────────────────────────────

function LensCard({
  lens,
  selected,
  suggestion,
  onSelect,
}: {
  lens: Lens
  selected: boolean
  suggestion: Suggestion | undefined
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="text-left transition-all"
      style={{
        background: selected ? `${lens.iconBg}` : 'var(--surface)',
        border: selected
          ? `1.5px solid ${lens.badgeColor}`
          : '1px solid var(--border)',
        borderRadius: '4px',
        padding: '1.25rem 1rem 1rem',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? `0 0 0 3px ${lens.iconBg}` : 'none',
        width: '100%',
      }}
    >
      {/* Selected checkmark */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '0.65rem',
            right: '0.65rem',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: lens.badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Suggested badge */}
      {suggestion && (
        <div
          className="text-xs uppercase tracking-widest mb-3"
          style={{
            fontFamily: 'var(--font-mono)',
            color: lens.badgeColor,
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
          }}
        >
          ✦ Suggested
        </div>
      )}

      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: lens.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.85rem',
          marginTop: suggestion ? 0 : '0.15rem',
        }}
      >
        <LensIcon id={lens.id} color={lens.iconColor} />
      </div>

      {/* Label */}
      <div
        className="font-bold mb-1"
        style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-hi)',
          fontSize: '1.05rem',
        }}
      >
        {lens.label}
      </div>

      {/* Description */}
      <div
        className="text-sm leading-relaxed mb-3"
        style={{ color: 'var(--text-body)', fontFamily: 'var(--font-serif)' }}
      >
        {lens.description}
      </div>

      {/* Badge */}
      <div
        className="text-xs"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: `${lens.badgeColor}15`,
          border: `1px solid ${lens.badgeColor}30`,
          borderRadius: '999px',
          padding: '0.18rem 0.6rem',
          color: lens.badgeColor,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {lens.badge}
      </div>

      {/* Suggestion reason */}
      {suggestion && (
        <p
          className="text-xs leading-relaxed mt-2"
          style={{
            color: 'var(--text-mid)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}
        >
          {suggestion.reason}
        </p>
      )}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
// This is the junction between both input paths (voice and upload) and report
// generation. It does not receive the transcript via props or URL params —
// it reads it from sessionStorage on mount. Both /your-map/voice and
// /your-map/upload write to sessionStorage before navigating here.
//
// On mount it also fires a background request to /api/suggest-lens (non-blocking)
// which returns 1-2 AI-recommended lenses that appear as "✦ Suggested" badges.
// The top suggestion auto-selects only if the user hasn't already changed from
// the default ('pattern'). This fires early so the result usually arrives before
// the user reads all the lens descriptions.
//
// handleContinue writes the selected lens id to sessionStorage ('mindreport_lens')
// then navigates to /your-map/report, which reads it on mount and calls the API.

export default function LensPage() {
  const router = useRouter()
  const [selectedLens, setSelectedLens] = useState<string>('pattern')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [sampleExpanded, setSampleExpanded] = useState(false)
  const [transcriptMeta, setTranscriptMeta] = useState<{ method: string; words: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const hasFetched = useRef(false)

  // Read transcript from sessionStorage and fire suggestion request
  useEffect(() => {
    const transcript = sessionStorage.getItem('mindreport_transcript') ?? ''
    const method     = sessionStorage.getItem('mindreport_input_method') ?? 'interview'

    if (!transcript) return

    const words = transcript.trim().split(/\s+/).filter(Boolean).length
    setTranscriptMeta({ method, words })

    if (hasFetched.current) return
    hasFetched.current = true

    // Background suggestion call — non-blocking
    fetch('/api/suggest-lens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: transcript.slice(0, 4000) }),
    })
      .then((r) => r.json())
      .then((d: { suggestions?: Suggestion[] }) => {
        if (d.suggestions?.length) {
          setSuggestions(d.suggestions)
          // Auto-select the top suggestion if the user hasn't changed their choice
          setSelectedLens((prev) => (prev === 'pattern' ? d.suggestions![0].id : prev))
        }
      })
      .catch(() => {})
  }, [])

  const handleContinue = useCallback(() => {
    sessionStorage.setItem('mindreport_lens', selectedLens)
    router.push('/your-map/report')
  }, [selectedLens, router])

  const activeLens = LENSES.find((l) => l.id === selectedLens) ?? LENSES[0]

  const filteredLenses = searchQuery.trim()
    ? LENSES.filter((l) => {
        const q = searchQuery.toLowerCase()
        return (
          l.label.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.badge.toLowerCase().includes(q)
        )
      })
    : LENSES

  const methodLabel: Record<string, string> = {
    voice:   'Voice interview',
    guided:  'Guided prompts',
    form:    'Form',
    write:   'Free write',
    upload:  'Uploaded document',
  }

  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '780px' }}>

        {/* Breadcrumb */}
        <div className="mb-10">
          <Link
            href={
              transcriptMeta?.method === 'upload' ? '/your-map/upload'
              : transcriptMeta?.method === 'voice' ? '/your-map/voice'
              : '/your-map'
            }
            className="text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}
          >
            ← Back
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-faint)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              padding: '0.25rem 0.75rem',
            }}
          >
            Step 2 of 3
          </span>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <div style={{ width: 22, height: 8, borderRadius: '999px', background: 'var(--accent)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}
          >
            Choose a Lens
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-4"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-hi)',
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            What do you want your map to illuminate?
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-deck)',
              fontSize: '1.1rem',
              maxWidth: '560px',
            }}
          >
            The same story reads differently depending on which angle you enter from. Choose the lens closest to what you are trying to see.
          </p>
        </div>

        {/* Input summary bar */}
        {transcriptMeta && (
          <div
            className="flex items-center justify-between mb-8 px-4 py-3 rounded-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <span
                className="text-xs uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
              >
                ✓ Input ready
              </span>
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
              >
                {methodLabel[transcriptMeta.method] ?? transcriptMeta.method}
              </span>
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
              >
                ~{transcriptMeta.words.toLocaleString()} words
              </span>
            </div>
            <Link
              href="/your-map"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
            >
              Change input
            </Link>
          </div>
        )}

        {/* Search bar */}
        <div className="relative mb-5">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search lenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.4rem',
              paddingRight: searchQuery ? '2.2rem' : '0.9rem',
              paddingTop: '0.65rem',
              paddingBottom: '0.65rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              color: 'var(--text-body)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.7rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-faint)',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0.15rem',
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Lens cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {filteredLenses.length > 0 ? (
            filteredLenses.map((lens) => (
              <LensCard
                key={lens.id}
                lens={lens}
                selected={selectedLens === lens.id}
                suggestion={suggestions.find((s) => s.id === lens.id)}
                onSelect={() => {
                  setSelectedLens(lens.id)
                  setSampleExpanded(false)
                }}
              />
            ))
          ) : (
            <div
              className="col-span-full py-10 text-center"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-faint)' }}
            >
              No lenses match &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        {/* Sample preview — collapsible */}
        <div
          className="rounded-sm mb-8 overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <button
            onClick={() => setSampleExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>✦</span>
              <span
                className="text-sm font-medium"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-body)', letterSpacing: '0.04em' }}
              >
                Sample: {activeLens.label} lens
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-faint)',
                transform: sampleExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}
            >
              ▾
            </span>
          </button>

          {sampleExpanded && (
            <div
              className="px-5 pb-5 flex flex-col gap-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {/* Quote */}
              <div className="pt-4">
                <p
                  className="text-base leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    color: activeLens.badgeColor,
                    fontSize: '1.05rem',
                  }}
                >
                  &ldquo;{activeLens.sample.quote}&rdquo;
                </p>
              </div>

              {[
                { label: 'Pattern',    text: activeLens.sample.pattern },
                { label: 'Cost',       text: activeLens.sample.cost },
                { label: 'Next move',  text: activeLens.sample.nextMove },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex gap-3"
                  style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-ghost)' }}
                >
                  <div
                    className="text-xs uppercase tracking-widest flex-shrink-0 pt-0.5"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: activeLens.badgeColor,
                      width: '72px',
                    }}
                  >
                    {item.label}
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-body)' }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA + disclaimer */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-sm text-sm font-medium transition-opacity hover:opacity-85"
            style={{
              background: 'var(--accent-dark)',
              color: '#F0ECE4',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            BEGIN CARTOGRAPHY →
          </button>

          <p
            className="text-center text-xs"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-faint)',
            }}
          >
            A lens is not a verdict. It is one way to read a territory.
          </p>
        </div>

      </div>
    </div>
  )
}
