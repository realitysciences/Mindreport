import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Mind Report',
  description: 'Get in touch with the Mind Report team.',
}

export default function ContactPage() {
  return (
    <div className="px-8 py-16">
      <div className="mx-auto" style={{ maxWidth: '560px' }}>

        <div className="mb-10">
          <h1
            className="text-xs uppercase tracking-widest mb-4"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
          >
            Contact
          </h1>
          <p
            className="text-2xl font-bold leading-tight"
            style={{ color: 'var(--text-hi)' }}
          >
            Get in touch
          </p>
        </div>

        <p
          className="text-sm leading-relaxed mb-10"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)' }}
        >
          Questions about a map, suggestions for future subjects, or anything else — reach out directly.
        </p>

        <a
          href="mailto:realitysciences@gmail.com"
          className="inline-flex items-center gap-3 px-6 py-4 rounded transition-colors"
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            color: 'var(--text-hi)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
          }}
        >
          <span style={{ color: 'var(--text-faint)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</span>
          realitysciences@gmail.com →
        </a>

        <p
          className="mt-8 text-xs leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
        >
          Mind Report is produced by{' '}
          <a
            href="https://www.relohu.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-lo)' }}
          >
            ReLoHu™
          </a>
          .
        </p>

      </div>
    </div>
  )
}
