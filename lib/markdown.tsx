import React from 'react'

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f0ece4;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

export function MarkdownBody({ content, categoryColor }: { content: string; categoryColor: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean)
  let sectionCount = 0

  return (
    <div>
      {blocks.map((block, i) => {
        const trimmed = block.trim()

        // ── Section headers ──────────────────────────────────────────────────
        if (trimmed.startsWith('## ')) {
          sectionCount++
          const num = String(sectionCount).padStart(2, '0')
          const text = trimmed.slice(3)
          return (
            <div
              key={i}
              className="mt-14 mb-6 flex items-stretch rounded overflow-hidden"
              style={{ border: '0.5px solid #2a2a2a' }}
            >
              {/* Colored number tab */}
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
              {/* Title area */}
              <div
                className="px-5 py-4 flex items-center flex-1"
                style={{ background: `${categoryColor}12` }}
              >
                <h2
                  className="font-bold leading-snug"
                  style={{ color: '#f0ece4', fontSize: '1.1rem', letterSpacing: '-0.01em' }}
                >
                  {text}
                </h2>
              </div>
            </div>
          )
        }

        // ── Blockquotes → big callout boxes ──────────────────────────────────
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
                    color: '#e8e4dc',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatInline(text) }}
                />
              </div>
            </div>
          )
        }

        // ── Body paragraphs ───────────────────────────────────────────────────
        return (
          <p
            key={i}
            className="mb-6"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              lineHeight: '1.95',
              color: '#c8c4bc',
            }}
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        )
      })}
    </div>
  )
}
