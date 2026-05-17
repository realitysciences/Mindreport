'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const data = new FormData()
    data.set('access_key', '4c2b7d93-8f72-4d9f-b942-d01053495f9c')
    data.set('subject', 'Mind Report newsletter signup')
    data.set('email', email)
    data.set('name', email)
    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      if (res.ok) { setStatus('success'); setEmail('') }
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
        You're in. →
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={status === 'sending'}
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRight: 'none',
            padding: '8px 10px',
            color: 'var(--text-hi)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          style={{
            background: 'var(--accent-dark)',
            color: '#F0ECE4',
            border: 'none',
            padding: '8px 12px',
            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            opacity: status === 'sending' ? 0.6 : 1,
          }}
        >
          →
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#c0392b' }}>
          Error. Try again.
        </p>
      )}
    </div>
  )
}
