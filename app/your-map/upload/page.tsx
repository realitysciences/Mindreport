'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'parsing' | 'ready' | 'error'

interface ParseResult {
  text: string
  wordCount: number
  filename: string
  method: string
}

// ── File type info ────────────────────────────────────────────────────────────

const ACCEPTED = '.pdf,.docx,.txt,.md'
const ACCEPTED_LABELS = ['PDF', 'DOCX', 'TXT', 'Markdown']

function fileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const icons: Record<string, string> = {
    pdf: '⬛',
    docx: '📄',
    txt: '📝',
    md: '📝',
  }
  return icons[ext] ?? '📄'
}

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    pdf: 'PDF document',
    docx: 'Word document',
    text: 'Text file',
  }
  return map[method] ?? 'Document'
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({
  onFile,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  disabled,
}: {
  onFile: (file: File) => void
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border: isDragging
          ? '2px dashed var(--accent)'
          : '1.5px dashed var(--border)',
        borderRadius: '6px',
        padding: '3rem 2rem',
        background: isDragging ? 'var(--surface-raised)' : 'var(--surface)',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* Upload icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: isDragging ? `rgba(192, 146, 48, 0.12)` : 'var(--surface-deep)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s ease',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDragging ? 'var(--accent)' : 'var(--text-mid)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.15s ease' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {/* Text */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            color: isDragging ? 'var(--accent)' : 'var(--text-body)',
            fontSize: '1.05rem',
            fontWeight: 500,
            marginBottom: '0.35rem',
            transition: 'color 0.15s ease',
          }}
        >
          {isDragging ? 'Drop to upload' : 'Drop your document here'}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-faint)',
            fontSize: '0.72rem',
            letterSpacing: '0.06em',
          }}
        >
          or click to browse
        </p>
      </div>

      {/* Accepted types */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {ACCEPTED_LABELS.map((label) => (
          <span
            key={label}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              color: 'var(--text-faint)',
              background: 'var(--surface-deep)',
              border: '1px solid var(--border-ghost)',
              borderRadius: '999px',
              padding: '0.15rem 0.55rem',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Preview card ──────────────────────────────────────────────────────────────

function PreviewCard({ result, onReplace }: { result: ParseResult; onReplace: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const preview = result.text.slice(0, 600).trim()
  const hasMore = result.text.length > 600

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '4px',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border-sub)',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>{fileIcon(result.filename)}</span>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--text-body)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '0.02em',
              }}
            >
              {result.filename}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-faint)',
                letterSpacing: '0.04em',
                marginTop: '0.15rem',
              }}
            >
              {methodLabel(result.method)} · ~{result.wordCount.toLocaleString()} words
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Green tick */}
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#22c55e20',
              border: '1px solid #22c55e50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            onClick={onReplace}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              color: 'var(--text-faint)',
              background: 'none',
              border: '1px solid var(--border-ghost)',
              borderRadius: '999px',
              padding: '0.2rem 0.65rem',
              cursor: 'pointer',
            }}
          >
            Replace
          </button>
        </div>
      </div>

      {/* Text preview */}
      <div style={{ padding: '0.85rem 1rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '0.88rem',
            color: 'var(--text-deck)',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}
        >
          {expanded ? result.text.slice(0, 2000) : preview}
          {!expanded && hasMore && '…'}
        </p>

        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              color: 'var(--text-faint)',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              cursor: 'pointer',
              display: 'block',
            }}
          >
            {expanded ? '▴ Show less' : '▾ Show more'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

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
    sessionStorage.setItem('mindreport_transcript', result.text)
    sessionStorage.setItem('mindreport_input_method', 'upload')
    router.push('/your-map/lens')
  }, [result, router])

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
