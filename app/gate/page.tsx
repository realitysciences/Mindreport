'use client'

import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// ── Inner (reads searchParams) ────────────────────────────────────────────────

function GateInner() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/your-map'

  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!value.trim() || loading) return

      setLoading(true)
      setError('')

      try {
        const res = await fetch('/api/gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: value.trim() }),
        })

        if (res.ok) {
          // Full navigation (not client-side) so middleware sees the new cookie
          window.location.href = from
        } else {
          const data = await res.json()
          setError(data.error ?? 'Incorrect password.')
          setValue('')
          inputRef.current?.focus()
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [value, loading, from]
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo mark */}
        <div className="flex justify-center mb-10">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.7" />
              <line x1="12" y1="3" x2="12" y2="21" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="font-bold mb-2"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-hi)',
              fontSize: '1.6rem',
              letterSpacing: '-0.01em',
            }}
          >
            Early access
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-deck)',
              fontSize: '0.97rem',
              lineHeight: 1.6,
            }}
          >
            Enter the password to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <input
            ref={inputRef}
            type="password"
            autoFocus
            autoComplete="current-password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'var(--surface)',
              border: error ? '1px solid rgba(212,83,126,0.6)' : '1px solid var(--border)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              color: 'var(--text-body)',
              outline: 'none',
              letterSpacing: '0.15em',
              transition: 'border-color 0.15s ease',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '0.88rem',
                color: '#D4537E',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!value.trim() || loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: value.trim() && !loading ? 'var(--accent-dark)' : 'var(--surface-deep)',
              color: value.trim() && !loading ? '#F0ECE4' : 'var(--text-faint)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              letterSpacing: '0.12em',
              cursor: value.trim() && !loading ? 'pointer' : 'default',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {loading ? 'CHECKING…' : 'ENTER →'}
          </button>
        </form>

      </div>
    </div>
  )
}

// ── Page (Suspense boundary for useSearchParams) ──────────────────────────────

export default function GatePage() {
  return (
    <Suspense>
      <GateInner />
    </Suspense>
  )
}
