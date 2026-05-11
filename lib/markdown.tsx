import React from 'react'

export function extractHeadings(body: string): { id: string; text: string; num: string }[] {
  const headings: { id: string; text: string; num: string }[] = []
  let count = 0
  for (const line of body.split('\n')) {
    if (line.startsWith('## ')) {
      count++
      const text = line.slice(3).trim()
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      headings.push({ id, text, num: String(count).padStart(2, '0') })
    }
  }
  return headings
}

function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-hi);font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((\/[^)]+)\)/g,
      '<a href="$2" style="color:var(--text-hi);text-decoration:underline;text-decoration-color:var(--border);text-underline-offset:3px" class="transition-colors hover:text-[#c8c4bc]">$1</a>'
    )
}

export function MarkdownBody({ content, categoryColor }: { content: string; categoryColor: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean)
  let sectionCount = 0

  return (
    <div>
      {blocks.map((block, i) => {
        const trimmed = block.trim()

        if (trimmed.startsWith('## ')) {
          sectionCount++
          const num = String(sectionCount).padStart(2, '0')
          const text = trimmed.slice(3)
          return (
            <div
              key={i}
              id={headingId(text)}
              className="mt-14 mb-6 flex items-stretch rounded overflow-hidden"
              style={{ border: '0.5px solid var(--border)', scrollMarginTop: '80px' }}
            >
              <div
                className="flex items-center justify-center px-4 flex-shrink-0"
                style={{ background: categoryColor, minWidth: '52px' }}
              >
                <span
                  className="font-bold"
                  style={{ color: '#0a0a0a', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  {num}
                </span>
              </div>
              <div
                className="px-5 py-4 flex items-center flex-1"
                style={{ background: `${categoryColor}12` }}
              >
                <h2
                  className="font-bold leading-snug"
                  style={{ color: 'var(--text-hi)', fontSize: '1.1rem', letterSpacing: '-0.01em' }}
                >
                  {text}
                </h2>
              </div>
            </div>
          )
        }

        if (trimmed.startsWith('>> ')) {
          const raw = trimmed.slice(3)
          const sepIdx = raw.lastIndexOf(' | ')
          const quoteText = sepIdx !== -1 ? raw.slice(0, sepIdx).replace(/^"|"$/g, '') : raw.replace(/^"|"$/g, '')
          const attribution = sepIdx !== -1 ? raw.slice(sepIdx + 3) : null
          return (
            <div
              key={i}
              className="my-10 rounded-lg overflow-hidden"
              style={{ borderLeft: `3px solid ${categoryColor}`, background: 'var(--surface)', padding: '1.5rem 1.75rem' }}
            >
              <p
                className="mb-3 leading-relaxed"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '1.1rem',
                  lineHeight: '1.75',
                  color: 'var(--text-hi)',
                }}
                dangerouslySetInnerHTML={{ __html: `“${formatInline(quoteText)}”` }}
              />
              {attribution && (
                <p
                  className="text-[0.65rem] uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-lo)' }}
                >
                  {attribution}
                </p>
              )}
            </div>
          )
        }

        if (trimmed.startsWith('> ')) {
          const text = trimmed.slice(2)
          return (
            <div
              key={i}
              className="my-10 rounded-lg overflow-hidden"
              style={{ border: `1px solid ${categoryColor}44`, background: `${categoryColor}0d` }}
            >
              <div
                className="px-2 py-1 text-[0.55rem] uppercase tracking-widest"
                style={{ background: `${categoryColor}22`, fontFamily: 'var(--font-mono)', color: categoryColor }}
              >
                Key Insight
              </div>
              <div className="px-6 py-5">
                <p
                  className="leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '1.15rem',
                    lineHeight: '1.8',
                    color: 'var(--text-hi)',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatInline(text) }}
                />
              </div>
            </div>
          )
        }

        return (
          <p
            key={i}
            className="mb-6"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              lineHeight: '1.95',
              color: 'var(--text-body)',
            }}
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        )
      })}
    </div>
  )
}
