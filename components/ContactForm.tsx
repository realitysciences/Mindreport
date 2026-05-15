'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '0.5px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text-hi)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const data = new FormData(form)
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      })
      if (res.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="px-6 py-8 rounded text-sm"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}
      >
        Message received. We will be in touch shortly.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="access_key" value="4c2b7d93-8f72-4d9f-b942-d01053495f9c" />
      <input type="hidden" name="subject" value="Mind Report contact form" />
      <input type="checkbox" name="botcheck" style={{ display: 'none' }} />

      <div className="flex flex-col gap-2">
        <label
          htmlFor="name"
          className="text-[0.6rem] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          Name
        </label>
        <input id="name" type="text" name="name" required placeholder="Your name" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-[0.6rem] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          Email
        </label>
        <input id="email" type="email" name="email" required placeholder="your@email.com" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="message"
          className="text-[0.6rem] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="Your message..."
          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
        />
      </div>

      {status === 'error' && (
        <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#c0392b' }}>
          Something went wrong. Please try again or email realitysciences@gmail.com directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="text-[0.65rem] uppercase tracking-widest px-6 py-3 rounded transition-opacity"
        style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          color: status === 'sending' ? 'var(--text-faint)' : 'var(--text-hi)',
          fontFamily: 'var(--font-mono)',
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {status === 'sending' ? 'Sending...' : 'Send message →'}
      </button>
    </form>
  )
}
