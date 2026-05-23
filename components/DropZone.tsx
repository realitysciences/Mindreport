// Drag-and-drop + click-to-browse file upload zone.
// File type validation lives here so callers can't accidentally bypass it.

'use client'

import { useRef } from 'react'

const ACCEPTED        = '.pdf,.docx,.rtf,.txt,.md,.png,.jpg,.jpeg,.webp,.vtt,.srt,.html,.htm,.json,.csv,.zip'
const ACCEPTED_LABELS = ['PDF', 'DOCX', 'TXT', 'Image', 'JSON', 'VTT/SRT', 'ZIP', 'more…']

export function DropZone({
  onFile,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  disabled,
}: {
  onFile:      (file: File) => void
  isDragging:  boolean
  onDragOver:  (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop:      (e: React.DragEvent) => void
  disabled:    boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border:      isDragging ? '2px dashed var(--accent)' : '1.5px dashed var(--border)',
        borderRadius: '6px',
        padding:     '3rem 2rem',
        background:  isDragging ? 'var(--surface-raised)' : 'var(--surface)',
        cursor:      disabled ? 'default' : 'pointer',
        transition:  'all 0.15s ease',
        textAlign:   'center',
        display:     'flex',
        flexDirection: 'column',
        alignItems:  'center',
        gap:         '1rem',
      }}
    >
      {/* Upload icon */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: isDragging ? 'rgba(192, 146, 48, 0.12)' : 'var(--surface-deep)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s ease',
      }}>
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isDragging ? 'var(--accent)' : 'var(--text-mid)'}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke 0.15s ease' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {/* Text */}
      <div>
        <p style={{
          fontFamily: 'var(--font-serif)',
          color:      isDragging ? 'var(--accent)' : 'var(--text-body)',
          fontSize:   '1.05rem', fontWeight: 500, marginBottom: '0.35rem',
          transition: 'color 0.15s ease',
        }}>
          {isDragging ? 'Drop to upload' : 'Drop a file here'}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
          or click to browse
        </p>
      </div>

      {/* Accepted types */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {ACCEPTED_LABELS.map(label => (
          <span key={label} style={{
            fontFamily:   'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
            color:        'var(--text-faint)', background: 'var(--surface-deep)',
            border:       '1px solid var(--border-ghost)', borderRadius: '999px',
            padding:      '0.15rem 0.55rem',
          }}>
            {label}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
