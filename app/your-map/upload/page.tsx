'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/Spinner'
import { DropZone } from '@/components/DropZone'
import { PreviewCard } from '@/components/PreviewCard'
import type { ParseResult } from '@/lib/parseDocument'
import { applyAliases } from '@/lib/text'

// ── Constants ─────────────────────────────────────────────────────────────────

const DYNAMIC = '[dynamic]' as const

// ── Main page ─────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'parsing' | 'ready' | 'error'

export default function UploadPage() {
  const router = useRouter()

  // ── Core state ───────────────────────────────────────────────────────────────
  const [phase,       setPhase]       = useState<Phase>('idle')
  const [isDragging,  setIsDragging]  = useState(false)
  const [result,      setResult]      = useState<ParseResult | null>(null)
  const [errorMsg,    setErrorMsg]    = useState('')

  // ── Conversation mode state ──────────────────────────────────────────────────
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null)
  const [viewerSpeaker,   setViewerSpeaker]   = useState<string | null>(null)
  const [speakerAliases,  setSpeakerAliases]  = useState<Record<string, string>>({})
  // User can override a false-positive speaker detection by clicking
  // "This isn't a conversation" — forces document mode regardless of speakers.
  const [forceDocMode, setForceDocMode] = useState(false)

  // ── Document mode state ──────────────────────────────────────────────────────
  const [authorMode, setAuthorMode] = useState<'self' | 'other'>('self')
  const [authorName, setAuthorName] = useState('')

  // ── Computed ─────────────────────────────────────────────────────────────────
  const isConversation = !forceDocMode && (result?.speakers?.length ?? 0) >= 2
  const canContinue    = !isConversation || !!selectedSpeaker

  // Auto-set viewerSpeaker when conversation detected
  useEffect(() => {
    if (!result?.speakers?.length) { setViewerSpeaker(null); return }
    const speakers = result.speakers
    if (speakers.includes('Me')) setViewerSpeaker('Me')
    else setViewerSpeaker(null)
  }, [result])

  // ── File handling ────────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    setPhase('parsing')
    setResult(null)
    setErrorMsg('')
    setSelectedSpeaker(null)
    setViewerSpeaker(null)
    setSpeakerAliases({})
    setForceDocMode(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body:   formData,
      })

      let data: Record<string, unknown> = {}
      try {
        data = await res.json()
      } catch {
        setErrorMsg(`Server error (${res.status}). Please try again or use a different file.`)
        setPhase('error')
        return
      }

      if (!res.ok) {
        setErrorMsg((data.error as string) ?? 'Could not read the file.')
        setPhase('error')
        return
      }

      // Basic field validation before trusting the cast
      if (typeof data.text !== 'string' || typeof data.wordCount !== 'number') {
        setErrorMsg('The file could not be read correctly. Please try another format.')
        setPhase('error')
        return
      }

      setResult(data as unknown as ParseResult)
      setPhase('ready')
    } catch {
      setErrorMsg('Could not reach the server. Please check your connection and try again.')
      setPhase('error')
    }
  }, [])

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }, [parseFile])

  const handleReplace = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setErrorMsg('')
    setSelectedSpeaker(null)
    setViewerSpeaker(null)
    setSpeakerAliases({})
    setForceDocMode(false)
  }, [])

  const handleContinue = useCallback(() => {
    if (!result || !canContinue) return

    let transcript = result.text
    let subject: string

    if (isConversation && selectedSpeaker) {
      // Apply any aliases the user provided
      transcript = applyAliases(result.text, speakerAliases)

      if (selectedSpeaker === DYNAMIC) {
        const speakers = result.speakers!
        const names    = speakers.map(s => {
          const alias = speakerAliases[s]?.trim()
          return alias || (s === 'Me' ? 'you' : s)
        })
        subject = `the dynamic between ${names.join(' and ')}`
      } else if (viewerSpeaker && selectedSpeaker === viewerSpeaker) {
        // User is mapping themselves
        subject = 'you'
      } else {
        // Mapping the other person
        subject = speakerAliases[selectedSpeaker]?.trim() || selectedSpeaker
      }
    } else {
      // Document mode
      subject = authorMode === 'self'
        ? 'you'
        : (authorName.trim() || 'the person described in this document')
    }

    sessionStorage.setItem('mindreport_transcript',    transcript)
    sessionStorage.setItem('mindreport_input_method',  'upload')
    sessionStorage.setItem('mindreport_subject',       subject)
    router.push('/your-map/lens')
  }, [result, canContinue, isConversation, selectedSpeaker, viewerSpeaker, speakerAliases, authorMode, authorName, router])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '640px' }}>

        {/* Breadcrumb */}
        <div className="mb-10">
          <Link
            href="/your-map"
            className="text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mid)' }}
          >
            ← Back
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <span
            className="text-xs"
            style={{
              fontFamily:   'var(--font-mono)',
              color:        'var(--text-faint)',
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: '999px',
              padding:      '0.25rem 0.75rem',
            }}
          >
            Step 1 of 3
          </span>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 22, height: 8, borderRadius: '999px', background: 'var(--accent)' }} />
            <div style={{ width: 8,  height: 8, borderRadius: '50%',   background: 'var(--border)' }} />
            <div style={{ width: 8,  height: 8, borderRadius: '50%',   background: 'var(--border)' }} />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}
          >
            Upload a File
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-4"
            style={{
              fontFamily:    'var(--font-serif)',
              color:         'var(--text-hi)',
              fontSize:      'clamp(1.75rem, 3vw, 2.4rem)',
              letterSpacing: '-0.02em',
            }}
          >
            Bring existing material
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle:  'italic',
              color:      'var(--text-deck)',
              fontSize:   'clamp(1rem, 2vw, 1.1rem)',
              maxWidth:   '500px',
              lineHeight: 1.7,
            }}
          >
            Upload a journal, therapy notes, a conversation export, or a screenshot of a chat. The map draws from what you bring.
          </p>
        </div>

        {/* Upload area */}
        {(phase === 'idle' || phase === 'error') && (
          <div className="mb-6">
            <DropZone
              onFile={parseFile}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={false}
            />

            {phase === 'error' && (
              <div
                className="mt-4 px-4 py-3 rounded-sm"
                style={{
                  background: 'rgba(212, 83, 126, 0.06)',
                  border:     '1px solid rgba(212, 83, 126, 0.25)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', color: '#D4537E', fontSize: '0.9rem', lineHeight: 1.55 }}>
                  {errorMsg}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Parsing state */}
        {phase === 'parsing' && (
          <div
            className="mb-6 flex items-center gap-3 px-5 py-4 rounded-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Spinner />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'var(--text-mid)' }}>
              Reading file…
            </p>
          </div>
        )}

        {/* Ready state */}
        {phase === 'ready' && result && (
          <>
            {/* File preview card */}
            <div className="mb-5">
              <PreviewCard
                result={
                  isConversation
                    ? { ...result, text: applyAliases(result.text, speakerAliases) }
                    : result
                }
                onReplace={handleReplace}
              />
            </div>

            {/* Word count guidance */}
            {result.wordCount < 200 ? (
              <div
                className="mb-6 px-4 py-3 rounded-sm"
                style={{ background: 'rgba(186, 117, 23, 0.07)', border: '1px solid rgba(186, 117, 23, 0.25)' }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--color-cat-events)', lineHeight: 1.55 }}>
                  <strong>Short document</strong> — the map draws better with more material. Consider combining multiple files before uploading.
                </p>
              </div>
            ) : result.wordCount >= 800 ? (
              <div
                className="mb-6 px-4 py-3 rounded-sm flex items-start gap-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)' }}
              >
                <span style={{ color: 'var(--accent)', fontSize: '0.9rem', marginTop: '0.05rem' }}>✦</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-deck)', lineHeight: 1.55 }}>
                  Rich material — {result.wordCount.toLocaleString()} words gives the map a lot to work with.
                </p>
              </div>
            ) : null}

            {/* ── Conversation mode ── */}
            {isConversation ? (
              <ConversationSelector
                speakers={result.speakers!}
                selectedSpeaker={selectedSpeaker}
                setSelectedSpeaker={setSelectedSpeaker}
                viewerSpeaker={viewerSpeaker}
                setViewerSpeaker={setViewerSpeaker}
                speakerAliases={speakerAliases}
                setSpeakerAliases={setSpeakerAliases}
                onNotConversation={() => {
                  setForceDocMode(true)
                  setSelectedSpeaker(null)
                }}
              />
            ) : (
              /* ── Document mode ── */
              <DocumentSelector
                authorMode={authorMode}
                setAuthorMode={setAuthorMode}
                authorName={authorName}
                setAuthorName={setAuthorName}
              />
            )}

            {/* CTA */}
            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full py-4 rounded-sm text-sm font-medium transition-opacity"
                style={{
                  background:  canContinue ? 'var(--accent-dark)' : 'var(--surface-deep)',
                  color:       canContinue ? '#F0ECE4' : 'var(--text-faint)',
                  fontFamily:  'var(--font-mono)',
                  letterSpacing: '0.1em',
                  border:      canContinue ? 'none' : '1px solid var(--border)',
                  cursor:      canContinue ? 'pointer' : 'default',
                  opacity:     canContinue ? 1 : 0.6,
                }}
              >
                {isConversation && !selectedSpeaker
                  ? 'SELECT A FOCUS ABOVE TO CONTINUE →'
                  : 'CONTINUE TO LENS →'}
              </button>

              <p
                className="text-center text-xs"
                style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-faint)' }}
              >
                Your file is processed in memory and never stored.
              </p>
            </div>
          </>
        )}

        {/* Guidance note — idle only */}
        {phase === 'idle' && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-ghost)' }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
              What works well
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                'Journal entries or personal writing',
                'Therapy session notes or summaries',
                'Letters — sent or unsent',
                'WhatsApp, iMessage, or Telegram exports',
                'Screenshots of conversations',
                'Voice memo transcripts (VTT / SRT)',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontFamily: 'var(--font-serif)', fontSize: '0.9rem', color: 'var(--text-deck)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--accent)', marginTop: '0.1rem', flexShrink: 0 }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  )
}

// ── ConversationSelector ──────────────────────────────────────────────────────

function ConversationSelector({
  speakers,
  selectedSpeaker,
  setSelectedSpeaker,
  viewerSpeaker,
  setViewerSpeaker,
  speakerAliases,
  setSpeakerAliases,
  onNotConversation,
}: {
  speakers:           string[]
  selectedSpeaker:    string | null
  setSelectedSpeaker: (s: string | null) => void
  viewerSpeaker:      string | null
  setViewerSpeaker:   (s: string | null) => void
  speakerAliases:     Record<string, string>
  setSpeakerAliases:  React.Dispatch<React.SetStateAction<Record<string, string>>>
  onNotConversation:  () => void
}) {
  const scopeCard = (isSelected: boolean): React.CSSProperties => ({
    display:        'flex',
    alignItems:     'center',
    gap:            '1rem',
    background:     isSelected ? 'rgba(192,146,48,0.07)' : 'var(--surface)',
    border:         isSelected ? '1.5px solid rgba(192,146,48,0.45)' : '1px solid var(--border)',
    borderRadius:   '8px',
    padding:        '1rem 1.1rem',
    cursor:         'pointer',
    textAlign:      'left',
    transition:     'all 0.15s',
    width:          '100%',
    boxSizing:      'border-box',
  })

  const scopeIcon = (isSelected: boolean): React.CSSProperties => ({
    width:          36,
    height:         36,
    borderRadius:   '50%',
    flexShrink:     0,
    transition:     'all 0.15s',
    background:     isSelected ? 'rgba(192,146,48,0.15)' : 'var(--surface-deep)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '0.95rem',
  })

  const names = speakers.map(s => speakerAliases[s]?.trim() || (s === 'Me' ? 'you' : s))
  const isDynSel = selectedSpeaker === DYNAMIC

  return (
    <div
      className="px-5 py-5 rounded-sm"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Section header */}
      <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
        Conversation detected
      </p>
      <p className="mb-5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-deck)', fontSize: '0.92rem', lineHeight: 1.55 }}>
        Who do you want the map to focus on?
      </p>

      {/* Speaker cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.55rem' }}>
        {speakers.map((speaker) => {
          const alias  = speakerAliases[speaker]?.trim()
          const label  = alias || speaker
          const isMe   = speaker === 'Me' && !alias
          const isSel  = selectedSpeaker === speaker
          return (
            <button
              key={speaker}
              onClick={() => setSelectedSpeaker(isSel ? null : speaker)}
              style={scopeCard(isSel)}
            >
              <div style={scopeIcon(isSel)}>
                <span style={{ color: isSel ? 'var(--accent)' : 'var(--text-faint)' }}>◯</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '0.98rem', color: isSel ? 'var(--text-hi)' : 'var(--text-body)', marginBottom: '0.15rem' }}>
                  {isMe ? 'My communication' : `${label}'s communication`}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.83rem', color: 'var(--text-faint)', lineHeight: 1.4 }}>
                  {isMe ? 'Patterns in how you speak' : `Patterns in how ${label} speaks`}
                </div>
              </div>
              {isSel && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}

        {/* Dynamic card */}
        <button onClick={() => setSelectedSpeaker(isDynSel ? null : DYNAMIC)} style={scopeCard(isDynSel)}>
          <div style={scopeIcon(isDynSel)}>
            <span style={{ color: isDynSel ? 'var(--accent)' : 'var(--text-faint)' }}>⇌</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '0.98rem', color: isDynSel ? 'var(--text-hi)' : 'var(--text-body)', marginBottom: '0.15rem' }}>
              The dynamic between both
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.83rem', color: 'var(--text-faint)', lineHeight: 1.4 }}>
              What is happening between {names.join(' and ')}
            </div>
          </div>
          {isDynSel && (
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* "You are:" identity strip */}
      <div
        className="mt-4 mb-4 px-4 py-3 rounded-sm"
        style={{ background: 'var(--surface-deep)', border: '1px solid var(--border-ghost)', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-faint)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          You are:
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {speakers.map(s => {
            const alias = speakerAliases[s]?.trim()
            const label = alias || s
            const isSel = viewerSpeaker === s
            return (
              <button
                key={s}
                onClick={() => setViewerSpeaker(isSel ? null : s)}
                style={{
                  padding:      '0.2rem 0.65rem',
                  borderRadius: '999px',
                  border:       isSel ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background:   isSel ? 'rgba(192,146,48,0.1)' : 'var(--surface)',
                  color:        isSel ? 'var(--accent)' : 'var(--text-mid)',
                  fontSize:     '0.82rem',
                  fontFamily:   'var(--font-serif)',
                  fontWeight:   isSel ? 700 : 400,
                  cursor:       'pointer',
                  transition:   'all 0.12s',
                }}
              >
                {label}
              </button>
            )
          })}
          <button
            onClick={() => setViewerSpeaker(null)}
            style={{
              padding:      '0.2rem 0.65rem',
              borderRadius: '999px',
              border:       viewerSpeaker === null ? '1px solid var(--border)' : '1px solid var(--border-ghost)',
              background:   viewerSpeaker === null ? 'var(--surface)' : 'transparent',
              color:        viewerSpeaker === null ? 'var(--text-mid)' : 'var(--text-faint)',
              fontSize:     '0.82rem',
              fontFamily:   'var(--font-serif)',
              cursor:       'pointer',
              transition:   'all 0.12s',
            }}
          >
            Not in this conversation
          </button>
        </div>
      </div>

      {/* Rename speakers */}
      <div style={{ borderTop: '1px solid var(--border-ghost)', paddingTop: '1rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
          Rename speakers <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </p>
        {speakers.map((speaker) => (
          <div key={speaker} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-faint)', minWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {speaker}
            </span>
            <input
              value={speakerAliases[speaker] ?? ''}
              onChange={e => setSpeakerAliases(prev => ({ ...prev, [speaker]: e.target.value }))}
              placeholder={speaker === 'Me' ? 'Your name, e.g. David' : 'e.g. Sarah, Mom, Alex…'}
              style={{
                flex:         1,
                background:   'var(--surface)',
                border:       '1px solid var(--border)',
                borderRadius: '4px',
                padding:      '0.3rem 0.6rem',
                fontFamily:   'var(--font-serif)',
                fontSize:     '0.88rem',
                color:        'var(--text-body)',
                outline:      'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
        ))}
      </div>

      {/* Escape hatch — if speaker detection was wrong */}
      <button
        onClick={onNotConversation}
        style={{
          marginTop:      '0.85rem',
          background:     'none',
          border:         'none',
          padding:        0,
          fontFamily:     'var(--font-serif)',
          fontStyle:      'italic',
          fontSize:       '0.8rem',
          color:          'var(--text-faint)',
          cursor:         'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'var(--border)',
        }}
      >
        This isn&apos;t a conversation
      </button>
    </div>
  )
}

// ── DocumentSelector ──────────────────────────────────────────────────────────

function DocumentSelector({
  authorMode,
  setAuthorMode,
  authorName,
  setAuthorName,
}: {
  authorMode:    'self' | 'other'
  setAuthorMode: (m: 'self' | 'other') => void
  authorName:    string
  setAuthorName: (n: string) => void
}) {
  const chipStyle = (isSelected: boolean): React.CSSProperties => ({
    padding:      '0.55rem 1.1rem',
    borderRadius: '999px',
    border:       isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
    background:   isSelected ? 'rgba(192,146,48,0.1)' : 'var(--surface)',
    color:        isSelected ? 'var(--accent)' : 'var(--text-body)',
    fontFamily:   'var(--font-serif)',
    fontSize:     '0.92rem',
    fontWeight:   isSelected ? 700 : 400,
    cursor:       'pointer',
    transition:   'all 0.15s',
  })

  return (
    <div
      className="px-5 py-5 rounded-sm"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
        Whose writing is this?
      </p>
      <p className="mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-deck)', fontSize: '0.92rem', lineHeight: 1.55 }}>
        The map will address the subject directly if it&apos;s yours.
      </p>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: authorMode === 'other' ? '1rem' : 0 }}>
        <button onClick={() => setAuthorMode('self')}  style={chipStyle(authorMode === 'self')}>
          {authorMode === 'self' && <span style={{ marginRight: '0.35rem', fontSize: '0.8rem' }}>✓</span>}
          I wrote this
        </button>
        <button onClick={() => setAuthorMode('other')} style={chipStyle(authorMode === 'other')}>
          {authorMode === 'other' && <span style={{ marginRight: '0.35rem', fontSize: '0.8rem' }}>✓</span>}
          Someone else wrote this
        </button>
      </div>

      {authorMode === 'other' && (
        <div>
          <input
            type="text"
            placeholder="Who are we mapping? e.g. a client, my partner, my brother"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            style={{
              width:        '100%',
              padding:      '0.65rem 0.9rem',
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: '4px',
              fontFamily:   'var(--font-serif)',
              fontSize:     '0.9rem',
              color:        'var(--text-body)',
              outline:      'none',
              boxSizing:    'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={e =>  { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
          <p className="mt-2 text-xs" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-faint)' }}>
            The map will refer to this person in third person.
          </p>
        </div>
      )}
    </div>
  )
}
