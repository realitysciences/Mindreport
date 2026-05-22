import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Your Own Map | Mind Report',
  description: 'Map your interior. Choose how you want to begin.',
}

const methods = [
  {
    href: '/your-map/voice',
    tag: 'Most guided',
    tagColor: 'var(--accent)',
    title: 'Voice Interview',
    description: 'Talk with an AI interviewer. It will ask you questions, follow threads, and listen. The most natural way to map your interior — no writing required.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
    featured: true,
  },
  {
    href: '/your-map/guided',
    tag: 'Self-paced',
    tagColor: '#7B9E87',
    title: 'Guided Prompts',
    description: 'Answer one question at a time, at your own pace. Each prompt goes a little deeper. Good if you want structure without having to talk.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    featured: false,
  },
  {
    href: '/your-map/form',
    tag: 'Fastest',
    tagColor: '#8B7BAE',
    title: 'Fill Out a Form',
    description: 'A set of fields covering the key areas of your life. Fill in what you know, skip what you don\'t. Takes about 10 minutes.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    featured: false,
  },
  {
    href: '/your-map/write',
    tag: 'Most open',
    tagColor: '#B07D5A',
    title: 'Free Write',
    description: 'Write whatever comes. Your story, your patterns, what you\'re trying to understand. No format, no prompts. Just you and the page.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    featured: false,
  },
  {
    href: '/your-map/upload',
    tag: 'Already written',
    tagColor: '#5A7B8A',
    title: 'Upload a Document',
    description: 'Have a journal, therapy notes, or something you\'ve already written? Paste it in or upload the file and we\'ll work from what you\'ve already put into words.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    featured: false,
  },
]

export default function YourMapPage() {
  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '860px' }}>

        {/* Header */}
        <div className="mb-12">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}
          >
            Your Map
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-4"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-hi)',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              letterSpacing: '-0.02em',
            }}
          >
            How would you like to begin?
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-deck)',
              fontSize: '1.2rem',
              maxWidth: '560px',
            }}
          >
            Every map starts with input. Choose the method that feels most natural to you — they all lead to the same place.
          </p>
        </div>

        {/* Featured method — Voice */}
        <Link
          href={methods[0].href}
          className="group block rounded-sm mb-4 transition-opacity hover:opacity-90"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${methods[0].tagColor}55`,
          }}
        >
          <div className="p-7 flex flex-col sm:flex-row sm:items-center gap-6">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: '56px',
                height: '56px',
                background: `${methods[0].tagColor}18`,
                border: `1px solid ${methods[0].tagColor}44`,
                color: methods[0].tagColor,
              }}
            >
              {methods[0].icon}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-3">
                <h2
                  className="font-bold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.35rem' }}
                >
                  {methods[0].title}
                </h2>
                <span
                  className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-sm"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: methods[0].tagColor,
                    background: `${methods[0].tagColor}18`,
                    border: `0.5px solid ${methods[0].tagColor}44`,
                  }}
                >
                  {methods[0].tag}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)', maxWidth: '520px' }}>
                {methods[0].description}
              </p>
            </div>
            <span
              className="text-xs uppercase tracking-widest flex-shrink-0 transition-opacity group-hover:opacity-70"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
            >
              Choose →
            </span>
          </div>
        </Link>

        {/* Remaining methods — 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {methods.slice(1).map((method) => (
            <Link
              key={method.href}
              href={method.href}
              className="group flex flex-col gap-4 p-6 rounded-sm transition-opacity hover:opacity-90"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: '44px',
                    height: '44px',
                    background: `${method.tagColor}14`,
                    border: `1px solid ${method.tagColor}33`,
                    color: method.tagColor,
                  }}
                >
                  {method.icon}
                </div>
                <span
                  className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-sm"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: method.tagColor,
                    background: `${method.tagColor}14`,
                    border: `0.5px solid ${method.tagColor}33`,
                  }}
                >
                  {method.tag}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h2
                  className="font-bold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)', fontSize: '1.15rem' }}
                >
                  {method.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                  {method.description}
                </p>
              </div>
              <span
                className="text-xs uppercase tracking-widest mt-auto pt-3 transition-opacity group-hover:opacity-70"
                style={{
                  borderTop: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                }}
              >
                Choose →
              </span>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p
          className="mt-10 text-xs text-center"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.05em' }}
        >
          All input is private by default. Nothing is stored without your consent.
        </p>

      </div>
    </div>
  )
}
