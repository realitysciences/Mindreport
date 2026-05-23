'use client'

import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const AGENT_ID = 'agent_5901kp0d9n5gfd4va0n9ffzt5sqd'

type Message = {
  role: 'agent' | 'user'
  text: string
  timestamp: number
}

type Phase = 'idle' | 'requesting' | 'active' | 'ended' | 'error'

function VoiceInterviewInner() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [name, setName] = useState('')
  const [age,  setAge]  = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const { startSession, endSession, isSpeaking, status } = useConversation({
    onMessage: (message: { message: string; source: string }) => {
      const role = message.source === 'ai' ? 'agent' : 'user'
      setTranscript((prev) => [
        ...prev,
        { role, text: message.message, timestamp: Date.now() },
      ])
    },
    onError: (error: string | Error) => {
      setErrorMsg(typeof error === 'string' ? error : error.message)
      setPhase('error')
    },
  })

  // Sync phase with SDK connection status
  useEffect(() => {
    if (status === 'connected' && phase === 'requesting') {
      setPhase('active')
    } else if (status === 'disconnected' && phase === 'active') {
      setPhase('ended')
    } else if (status === 'error' && (phase === 'requesting' || phase === 'active')) {
      // SDK reported an error — surface it through the error phase.
      // onError callback also fires and sets errorMsg, so we just update phase.
      setPhase('error')
    }
  }, [status, phase])

  // Start/stop elapsed timer based on phase
  useEffect(() => {
    if (phase === 'active') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // ── Minimum content thresholds ─────────────────────────────────────────────
  const MIN_USER_WORDS     = 120
  const MIN_USER_EXCHANGES = 5

  const userMessages   = transcript.filter((m) => m.role === 'user')
  const userWordCount  = userMessages.reduce(
    (acc, m) => acc + m.text.trim().split(/\s+/).filter(Boolean).length,
    0
  )
  const hasEnoughContent =
    userMessages.length >= MIN_USER_EXCHANGES && userWordCount >= MIN_USER_WORDS

  // Save transcript + stats to sessionStorage on end
  useEffect(() => {
    if (phase === 'ended' && transcript.length > 0) {
      const lines = transcript
        .map((m) => `${m.role === 'agent' ? 'Interviewer' : 'You'}: ${m.text}`)
        .join('\n\n')
      // Prepend name/age so Claude has subject context without it counting against
      // the user-words cap or requiring a separate API field.
      const nameTag = name.trim()
        ? `[Subject: ${name.trim()}${age.trim() ? `, age ${age.trim()}` : ''}]\n\n`
        : ''
      sessionStorage.setItem('mindreport_transcript', nameTag + lines)
      sessionStorage.setItem('mindreport_input_method', 'voice')
      sessionStorage.setItem('mindreport_subject', 'you')
      sessionStorage.setItem('mindreport_voice_stats', JSON.stringify({
        userWords: userWordCount,
        responses: userMessages.length,
        duration:  elapsed,
        name:      name.trim() || null,
        age:       age.trim()  || null,
      }))
    }
  }, [phase, transcript, userWordCount, elapsed, name, age])

  const startInterview = useCallback(async () => {
    setPhase('requesting')
    setErrorMsg('')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const trimmedName = name.trim()
      const trimmedAge  = age.trim()
      // DO NOT add an `overrides` key here, even with a subset of fields.
      // The SDK's constructOverrides() always emits { tts: {}, conversation: {} }
      // when any overrides key is set. The ElevenLabs backend reads empty objects
      // as "reset voice to null" and disconnects the session immediately with 0
      // responses. dynamicVariables is the only safe customisation path.
      startSession({
        agentId: AGENT_ID,
        connectionType: 'webrtc',
        dynamicVariables: {
          name: trimmedName,
          age:  trimmedAge || 'unknown',
        },
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Microphone access was denied.')
      setPhase('error')
    }
  }, [startSession, name, age])

  const endInterview = useCallback(async () => {
    try {
      await endSession()
    } catch { /* SDK cleanup failed — proceed anyway so the transcript isn't lost */ }
    setPhase('ended')
  }, [endSession])


  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '720px' }}>

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

        {/* Header */}
        <div className="mb-10">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.2em' }}
          >
            Voice Interview
          </span>
          <h1
            className="font-bold leading-tight mt-3 mb-4"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-hi)',
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {phase === 'idle' && 'Ready when you are.'}
            {phase === 'requesting' && 'Connecting...'}
            {phase === 'active' && (isSpeaking ? 'Interviewer is speaking.' : 'Your turn.')}
            {phase === 'ended' && 'Interview complete.'}
            {phase === 'error' && 'Something went wrong.'}
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-body)',
              fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
              maxWidth: '560px',
              lineHeight: 1.7,
            }}
          >
            {phase === 'idle' && 'The interviewer will ask you questions and follow threads as you speak. Answer as fully or as briefly as feels right. There are no wrong answers.'}
            {phase === 'requesting' && 'Requesting microphone access and connecting to your interviewer.'}
            {phase === 'active' && 'Speak naturally. Take your time. You can end the interview at any point.'}
            {phase === 'ended' && 'Your transcript has been saved. Continue to choose how your map should be read.'}
            {phase === 'error' && errorMsg}
          </p>
        </div>

        {/* ── Idle ── */}
        {phase === 'idle' && (
          <div className="flex flex-col gap-8">

            {/* Name + age inputs */}
            <div
              className="px-5 py-5 rounded-sm flex flex-col gap-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.14em' }}>
                Before we begin
              </p>
              <div className="flex gap-3">
                {/* Name */}
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em' }}
                  >
                    Name <span style={{ color: 'var(--accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your first name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1rem',
                      color: 'var(--text-body)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
                {/* Age */}
                <div style={{ flex: '0 0 100px' }}>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.08em' }}
                  >
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="—"
                    min={1}
                    max={120}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1rem',
                      color: 'var(--text-body)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
              </div>
            </div>

            {/* Mic + start */}
            <div className="flex flex-col items-center gap-6">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: '96px',
                  height: '96px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: name.trim() ? 'var(--accent)' : 'var(--text-faint)',
                  transition: 'color 0.2s',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <button
                onClick={startInterview}
                disabled={!name.trim()}
                className="px-8 py-4 rounded-sm text-sm font-medium transition-opacity hover:opacity-85"
                style={{
                  background: 'var(--accent-dark)',
                  color: '#F0ECE4',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  opacity: name.trim() ? 1 : 0.4,
                  cursor: name.trim() ? 'pointer' : 'default',
                }}
              >
                START INTERVIEW
              </button>
              <p className="text-xs text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                Your browser will ask for microphone permission.
              </p>
            </div>

          </div>
        )}

        {/* ── Connecting ── */}
        {phase === 'requesting' && (
          <div className="flex items-center justify-center py-16">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '96px',
                height: '96px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-faint)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.5s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            </div>
          </div>
        )}

        {/* ── Active ── */}
        {phase === 'active' && (
          <div className="flex flex-col gap-6">
            {/* Waveform */}
            <div className="flex items-center justify-center gap-1.5 py-8">
              {[...Array(11)].map((_, i) => {
                const heights = [8, 14, 20, 26, 32, 36, 32, 26, 20, 14, 8]
                return (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      borderRadius: '2px',
                      background: 'var(--accent)',
                      height: isSpeaking ? `${heights[i]}px` : '5px',
                      opacity: isSpeaking ? 0.75 : 0.25,
                      transition: `height ${0.1 + i * 0.02}s ease, opacity 0.2s ease`,
                    }}
                  />
                )
              })}
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <span
                className="text-xs tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', letterSpacing: '0.1em' }}
              >
                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Live transcript */}
            {transcript.length > 0 && (
              <div
                className="rounded-sm overflow-y-auto flex flex-col gap-5 p-5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight: '320px',
                }}
              >
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: msg.role === 'agent' ? 'var(--accent)' : 'var(--text-faint)',
                      }}
                    >
                      {msg.role === 'agent' ? 'Interviewer' : 'You'}
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: 'var(--text-body)',
                        maxWidth: '85%',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={endInterview}
                className="px-6 py-3 rounded-sm text-xs transition-opacity hover:opacity-70"
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-mid)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                }}
              >
                END INTERVIEW
              </button>
            </div>
          </div>
        )}

        {/* ── Ended ── */}
        {phase === 'ended' && (
          <div className="flex flex-col gap-6">

            {/* ── Thin content warning ── */}
            {!hasEnoughContent && (
              <div
                className="rounded-sm px-5 py-4 flex flex-col gap-3"
                style={{
                  background: 'var(--surface-deep)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div className="flex flex-col gap-1">
                    <p
                      className="text-sm font-medium"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-hi)' }}
                    >
                      The interview may be too short for a strong map.
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-mid)' }}
                    >
                      Good cartography needs depth. You gave {userMessages.length} {userMessages.length === 1 ? 'response' : 'responses'} and about {userWordCount} {userWordCount === 1 ? 'word' : 'words'} - ideally we need at least {MIN_USER_EXCHANGES} responses and {MIN_USER_WORDS} words from you to draw a meaningful map.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={() => {
                      setPhase('idle')
                      setTranscript([])
                      setElapsed(0)
                    }}
                    className="px-5 py-2.5 rounded-sm text-xs font-medium transition-opacity hover:opacity-85"
                    style={{
                      background: 'var(--accent-dark)',
                      color: '#F0ECE4',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.08em',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    DO ANOTHER INTERVIEW
                  </button>
                  <Link
                    href="/your-map/voice/review"
                    className="px-5 py-2.5 rounded-sm text-xs transition-opacity hover:opacity-70"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--text-faint)',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Continue anyway
                  </Link>
                </div>
              </div>
            )}

            {/* Transcript */}
            {transcript.length > 0 && (
              <div
                className="rounded-sm overflow-y-auto flex flex-col gap-5 p-5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight: '420px',
                }}
              >
                <div
                  className="text-xs uppercase tracking-widest mb-1"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
                >
                  Your transcript
                </div>
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: msg.role === 'agent' ? 'var(--accent)' : 'var(--text-faint)',
                      }}
                    >
                      {msg.role === 'agent' ? 'Interviewer' : 'You'}
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: 'var(--text-body)',
                        maxWidth: '85%',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Footer: stats + continue (only shown when content is sufficient) */}
            {hasEnoughContent && (
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                  {userMessages.length} responses &middot; ~{userWordCount} words &middot; {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                </p>
                <Link
                  href="/your-map/voice/review"
                  className="flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-medium transition-opacity hover:opacity-85"
                  style={{
                    background: 'var(--accent-dark)',
                    color: '#F0ECE4',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                  }}
                >
                  CONTINUE →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-6 py-10">
            <p
              className="text-sm text-center"
              style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', maxWidth: '400px' }}
            >
              {errorMsg || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { setPhase('idle'); setErrorMsg('') }}
              className="px-6 py-3 rounded-sm text-xs transition-opacity hover:opacity-70"
              style={{
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-mid)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default function VoiceInterviewPage() {
  return (
    <ConversationProvider>
      <VoiceInterviewInner />
    </ConversationProvider>
  )
}
