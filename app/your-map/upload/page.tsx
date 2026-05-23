'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/Spinner'
import { DropZone } from '@/components/DropZone'
import { PreviewCard } from '@/components/PreviewCard'
import type { ParseResult } from '@/lib/parseDocument'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'parsing' | 'ready' | 'error'

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [authorMode, setAuthorMode] = useState<'self' | 'other'>('self')
  const [authorName, setAuthorName] = useState('')

  // ── File handling ────────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    setPhase('parsing')
    setResult(null)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      })

      // Try to parse JSON — if the server returned an HTML error page, this throws
      let data: Record<string, unknown> = {}
      try {
        data = await res.json()
      } catch {
        setErrorMsg(`Server error (${res.status}). Please try again or use a different file.`)
        setPhase('error')
        return
      }

      if (!res.ok) {
        setErrorMsg((data.error as string) ?? 'Could not read the file.')
        setPhase('error')
        return
      }

      setResult(data as unknown as ParseResult)
      setPhase('ready')
    } catch {
      setErrorMsg('Could not reach the server. Please check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file)
    },
    [parseFile]
  )

  const handleReplace = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setErrorMsg('')
  }, [])

  const handleContinue = useCallback(() => {
    if (!result) return
    const subject = authorMode === 'self'
      ? 'you'
      : (authorName.trim() || 'the person described in this document')
    sessionStorage.setItem('mindreport_transcript', result.text)
    sessionStorage.setItem('mindreport_input_method', 'upload')
    sessionStorage.setItem('mindreport_subject', subject)
    router.push('/your-map/lens')
  }, [result, router, authorMode, authorName])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '640px' }}>

        {/* Breadcrumb */}
        <div className="mb-10">
          <Link
            href="/your-map"
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
            Upload a Document
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
            Bring existing material
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
            Upload a journal entry, therapy notes, a letter you never sent, or anything that holds significant personal material. The map is drawn from what you bring.
          </p>
        </div>

        {/* Upload area */}
        {(phase === 'idle' || phase === 'error') && (
          <div className="mb-6">
            <DropZone
              onFile={parseFile}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={false}
            />

            {/* Error message */}
            {phase === 'error' && (
              <div
                className="mt-4 px-4 py-3 rounded-sm"
                style={{
                  background: 'rgba(212, 83, 126, 0.06)',
                  border: '1px solid rgba(212, 83, 126, 0.25)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: '#D4537E',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                  }}
                >
                  {errorMsg}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Parsing state */}
        {phase === 'parsing' && (
          <div
            className="mb-6 flex items-center gap-3 px-5 py-4 rounded-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Spinner />
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                letterSpacing: '0.06em',
                color: 'var(--text-mid)',
              }}
            >
              Reading document…
            </p>
          </div>
        )}

        {/* Ready state */}
        {phase === 'ready' && result && (
          <div className="mb-6">
            <PreviewCard result={result} onReplace={handleReplace} />
          </div>
        )}

        {/* Word count guidance */}
        {phase === 'ready' && result && (
          <div className="mb-8">
            {result.wordCount < 200 ? (
              <div
                className="px-4 py-3 rounded-sm"
                style={{
                  background: 'rgba(186, 117, 23, 0.07)',
                  border: '1px solid rgba(186, 117, 23, 0.25)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.88rem',
                    color: 'var(--color-cat-events)',
                    lineHeight: 1.55,
                  }}
                >
                  <strong>Short document</strong> - the map draws better with more material. If you have other notes or writing, consider combining them into a single file before uploading.
                </p>
              </div>
            ) : result.wordCount >= 800 ? (
              <div
                className="px-4 py-3 rounded-sm flex items-start gap-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)' }}
              >
                <span style={{ color: 'var(--accent)', fontSize: '0.9rem', marginTop: '0.05rem' }}>✦</span>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '0.88rem',
                    color: 'var(--text-deck)',
                    lineHeight: 1.55,
                  }}
                >
                  Rich material - {result.wordCount.toLocaleString()} words gives the map a lot to work with.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Author attribution */}
        {phase === 'ready' && result && (
          <div className="mb-8 px-5 py-4 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
              Whose writing is this?
            </p>
            <div className="flex flex-col gap-3">
              {(['self', 'other'] as const).map(mode => (
                <label
                  key={mode}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                >
                  <div
                    onClick={() => setAuthorMode(mode)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: authorMode === mode ? `4px solid var(--accent)` : '1.5px solid var(--border)',
                      background: 'var(--surface)',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'border 0.1s',
                    }}
                  />
                  <span
                    onClick={() => setAuthorMode(mode)}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      color: authorMode === mode ? 'var(--text-hi)' : 'var(--text-body)',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                    }}
                  >
                    {mode === 'self' ? 'My own writing' : 'Writing about or from someone else'}
                  </span>
                </label>
              ))}
            </div>
            {authorMode === 'other' && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Who are we mapping? e.g. a client, my partner, my brother"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.9rem',
                    color: 'var(--text-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
                <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-faint)' }}>
                  The map will refer to this person in third person using their name or description.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {phase === 'ready' && result && (
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
              Your document is processed locally and never stored.
            </p>
          </div>
        )}

        {/* Guidance note — idle only */}
        {phase === 'idle' && (
          <div
            className="mt-8 pt-6"
            style={{ borderTop: '1px solid var(--border-ghost)' }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
            >
              What works well
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              {[
                'Journal entries or personal writing',
                'Therapy session notes or summaries',
                'Letters - sent or unsent',
                'Anything you wrote during a difficult time',
                'Stream-of-consciousness writing',
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.9rem',
                    color: 'var(--text-deck)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: 'var(--accent)', marginTop: '0.1rem', flexShrink: 0 }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  )
}
