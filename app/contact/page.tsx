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
          <span
            className="text-[0.65rem] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
          >
            Contact
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-5"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '2.25rem', letterSpacing: '-0.02em' }}
          >
            Get in touch
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-deck)' }}
          >
            Questions about a map, suggestions for future subjects, correction requests, or removal requests — reach out directly. All requests are reviewed promptly.
          </p>
        </div>

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
            style={{ color: 'var(--text-mid)' }}
          >
            ReLoHu™
          </a>
          .
        </p>

      </div>
    </div>
  )
}
