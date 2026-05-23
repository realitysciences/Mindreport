'use client'

// Review page shown after an ElevenLabs voice interview ends.
// Mirrors the upload confirmation page — shows what was captured
// (word count, stats, transcript preview) before continuing to lens selection.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type VoiceStats = {
  userWords: number
  responses: number
  duration:  number  // seconds
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PREVIEW_CHARS = 600

export default function VoiceReviewPage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState<string | null>(null)
  const [stats,      setStats]      = useState<VoiceStats | null>(null)
  const [expanded,   setExpanded]   = useState(false)

  useEffect(() => {
    const t = sessionStorage.getItem('mindreport_transcript')
    const s = sessionStorage.getItem('mindreport_voice_stats')

    // If no voice transcript is available, send back to the interview page
    if (!t || sessionStorage.getItem('mindreport_input_method') !== 'voice') {
      router.replace('/your-map/voice')
      return
    }

    setTranscript(t)

    if (s) {
      try { setStats(JSON.parse(s) as VoiceStats) } catch { /* ignore */ }
    }
  }, [router])

  const handleContinue = useCallback(() => {
    router.push('/your-map/lens')
  }, [router])

  if (!transcript) return null

  const preview   = transcript.slice(0, PREVIEW_CHARS).trim()
  const hasMore   = transcript.length > PREVIEW_CHARS
  const wordCount = stats?.userWords ?? 0

  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '640px' }}>

        {/* Breadcrumb */}
        <div className="mb-10">
          <Link
            href="/your-map/voice"
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
            Step 1 of 3
          </span>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 22, height: 8, borderRadius: '999px', background: 'var(--accent)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}
          >
            Voice Interview
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-4"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-hi)',
              fontSize: 'clamp(1.75rem, 3vw, 2.4rem)',
              letterSpacing: '-0.02em',
            }}
          >
            Interview captured.
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-deck)',
              fontSize: 'clamp(1rem, 2vw, 1.1rem)',
              maxWidth: '500px',
              lineHeight: 1.7,
            }}
          >
            Review what was captured before drawing your map.
          </p>
        </div>

        {/* Preview card — mirrors PreviewCard from upload */}
        <div
          className="mb-6"
          style={{ border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', overflow: 'hidden' }}
        >
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-sub)', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <span style={{ fontSize: '1.1rem' }}>🎙</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-body)', letterSpacing: '0.02em' }}>
                  Voice interview
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
                  ~{wordCount.toLocaleString()} words you spoke
                  {stats?.responses ? ` · ${stats.responses} responses` : ''}
                  {stats?.duration   ? ` · ${formatDuration(stats.duration)}` : ''}
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
              <Link
                href="/your-map/voice"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.06em',
                  color: 'var(--text-faint)', border: '1px solid var(--border-ghost)',
                  borderRadius: '999px', padding: '0.2rem 0.65rem', textDecoration: 'none',
                }}
              >
                Redo
              </Link>
            </div>
          </div>

          {/* Transcript preview */}
          <div style={{ padding: '0.85rem 1rem' }}>
            <p style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.88rem',
              color: 'var(--text-deck)', lineHeight: 1.65, whiteSpace: 'pre-wrap',
            }}>
              {expanded ? transcript.slice(0, 4000) : preview}
              {!expanded && hasMore && '…'}
            </p>
            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.06em',
                  color: 'var(--text-faint)', background: 'none', border: 'none',
                  padding: '0.5rem 0 0', cursor: 'pointer', display: 'block',
                }}
              >
                {expanded ? '▴ Show less' : '▾ Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Word count guidance — mirrors upload page */}
        <div className="mb-8">
          {wordCount > 0 && wordCount < 150 ? (
            <div
              className="px-4 py-3 rounded-sm"
              style={{
                background: 'rgba(186, 117, 23, 0.07)',
                border: '1px solid rgba(186, 117, 23, 0.25)',
              }}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--color-cat-events)', lineHeight: 1.55 }}>
                <strong>Short interview</strong> — the map draws better with more material. Consider doing a longer interview before continuing.
              </p>
            </div>
          ) : wordCount >= 600 ? (
            <div
              className="px-4 py-3 rounded-sm flex items-start gap-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)' }}
            >
              <span style={{ color: 'var(--accent)', fontSize: '0.9rem', marginTop: '0.05rem' }}>✦</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-deck)', lineHeight: 1.55 }}>
                Rich material — ~{wordCount.toLocaleString()} words gives the map a lot to work with.
              </p>
            </div>
          ) : null}
        </div>

        {/* CTA */}
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
            CONTINUE TO LENS →
          </button>

          <p
            className="text-center text-xs"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-faint)',
            }}
          >
            Your interview is processed locally and never stored.
          </p>
        </div>

      </div>
    </div>
  )
}
