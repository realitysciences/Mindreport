import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact | Mind Report',
  description: 'Get in touch with the Mind Report team. Questions, suggestions, correction requests, and removal requests.',
  alternates: {
    canonical: 'https://mindreport.ai/contact',
  },
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
          <p className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-hi)' }}>
            Get in touch
          </p>
        </div>

        <p
          className="text-sm leading-relaxed mb-10"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)' }}
        >
          Questions about a map, suggestions for future subjects, correction requests, or removal requests - reach out directly. All requests are reviewed promptly.
        </p>

        <ContactForm />

        <p
          className="mt-10 text-xs leading-relaxed"
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
