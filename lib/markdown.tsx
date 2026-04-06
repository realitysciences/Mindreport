import React from 'react'

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f0ece4">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

export function MarkdownBody({ content, categoryColor }: { content: string; categoryColor: string }) {
  const blocks = content.split(/\n\n+/).filter(Boolean)

  return (
    <div>
      {blocks.map((block, i) => {
        const trimmed = block.trim()

        if (trimmed.startsWith('## ')) {
          const text = trimmed.slice(3)
          return (
            <h2
              key={i}
              className="flex items-center gap-2 mt-10 mb-4 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: '#999' }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: categoryColor }}
              />
              {text}
            </h2>
          )
        }

        if (trimmed.startsWith('> ')) {
          const text = trimmed.slice(2)
          return (
            <blockquote
              key={i}
              className="my-8 pl-6 py-1"
              style={{
                borderLeft: '1px solid #2e2e2e',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '1.1rem',
                lineHeight: '1.75',
                color: '#d0ccc4',
              }}
              dangerouslySetInnerHTML={{ __html: formatInline(text) }}
            />
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
              color: '#c8c4bc',
            }}
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        )
      })}
    </div>
  )
}
