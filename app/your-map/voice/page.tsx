'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// Set your ElevenLabs Agent ID here, or better: add it to .env.local as
// NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
// ─────────────────────────────────────────────────────────────────────────────
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? 'YOUR_AGENT_ID_HERE'

import { useConversation } from '@11labs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Message = {
  role: 'agent' | 'user'
  text: string
  timestamp: number
}

type Phase = 'idle' | 'requesting' | 'active' | 'ended' | 'error'

export default function VoiceInterviewPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const conversation = useConversation({
    onConnect: () => setPhase('active'),
    onDisconnect: () => {
      if (phase !== 'error') setPhase('ended')
    },
    onMessage: ({ message, source }: { message: string; source: 'ai' | 'user' }) => {
      setTranscript((prev) => [
        ...prev,
        { role: source === 'ai' ? 'agent' : 'user', text: message, timestamp: Date.now() },
      ])
    },
    onError: (msg: string) => {
      setErrorMsg(msg)
      setPhase('error')
    },
  })

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Save transcript to sessionStorage when interview ends
  useEffect(() => {
    if (phase === 'ended' && transcript.length > 0) {
      const raw = transcript
        .map((m) => `${m.role === 'agent' ? 'Interviewer' : 'You'}: ${m.text}`)
        .join('\n\n')
      sessionStorage.setItem('mindreport_transcript', raw)
      sessionStorage.setItem('mindreport_input_method', 'voice')
    }
  }, [phase, transcript])

  const startInterview = useCallback(async () => {
    setPhase('requesting')
    setErrorMsg('')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      await conversation.startSession({ agentId: AGENT_ID })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Microphone access was denied.')
      setPhase('error')
    }
  }, [conversation])

  const endInterview = useCallback(async () => {
    await conversation.endSession()
    setPhase('ended')
  }, [conversation])

  const isSpeaking = conversation.isSpeaking

  return (
    <div className="px-6 py-14">
      <div className="mx-auto" style={{ maxWidth: '720px' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10">
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
            {phase === 'active' && (isSpeaking ? 'Listening...' : 'Your turn to speak.')}
            {phase === 'ended' && 'Interview complete.'}
            {phase === 'error' && 'Something went wrong.'}
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--text-deck)',
              fontSize: '1.1rem',
              maxWidth: '520px',
            }}
          >
            {phase === 'idle' && 'The interviewer will ask you questions and follow threads as you speak. Answer as fully or as briefly as feels right. There are no wrong answers.'}
            {phase === 'requesting' && 'Requesting microphone access and connecting to your interviewer.'}
            {phase === 'active' && 'Speak naturally. Take your time. You can end the interview at any point.'}
            {phase === 'ended' && 'Your transcript has been saved. Continue to choose how your map should be read.'}
            {phase === 'error' && errorMsg}
          </p>
        </div>

        {/* ── Idle state ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-8 py-12">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '96px',
                height: '96px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
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
              className="px-8 py-4 rounded-sm text-sm font-medium transition-opacity hover:opacity-85"
              style={{
                background: 'var(--accent-dark)',
                color: '#F0ECE4',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
              }}
            >
              START INTERVIEW
            </button>
            <p className="text-xs text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
              Your browser will ask for microphone permission.
            </p>
          </div>
        )}

        {/* ── Connecting state ── */}
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
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
        )}

        {/* ── Active interview ── */}
        {phase === 'active' && (
          <div className="flex flex-col gap-6">
            {/* Waveform indicator */}
            <div className="flex items-center justify-center gap-1.5 py-6">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    borderRadius: '2px',
                    background: 'var(--accent)',
                    height: isSpeaking
                      ? `${12 + Math.sin(i * 0.9) * 10 + 8}px`
                      : '6px',
                    opacity: isSpeaking ? 0.8 : 0.3,
                    transition: 'height 0.15s ease, opacity 0.15s ease',
                  }}
                />
              ))}
            </div>

            {/* Live transcript */}
            {transcript.length > 0 && (
              <div
                className="rounded-sm overflow-y-auto flex flex-col gap-4 p-5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight: '320px',
                }}
              >
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="text-xs uppercase tracking-widest flex-shrink-0 pt-0.5"
                      style={{ fontFamily: 'var(--font-mono)', color: msg.role === 'agent' ? 'var(--accent)' : 'var(--text-mid)', width: '72px', textAlign: msg.role === 'user' ? 'right' : 'left' }}
                    >
                      {msg.role === 'agent' ? 'Interviewer' : 'You'}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                      {msg.text}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* End button */}
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

        {/* ── Ended state ── */}
        {phase === 'ended' && (
          <div className="flex flex-col gap-8">
            {/* Full transcript review */}
            {transcript.length > 0 && (
              <div
                className="rounded-sm overflow-y-auto flex flex-col gap-4 p-5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  maxHeight: '400px',
                }}
              >
                <div
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}
                >
                  Your transcript
                </div>
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="text-xs uppercase tracking-widest flex-shrink-0 pt-0.5"
                      style={{ fontFamily: 'var(--font-mono)', color: msg.role === 'agent' ? 'var(--accent)' : 'var(--text-mid)', width: '72px', textAlign: msg.role === 'user' ? 'right' : 'left' }}
                    >
                      {msg.role === 'agent' ? 'Interviewer' : 'You'}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                {transcript.length} exchanges recorded
              </p>
              <Link
                href="/your-map/lens"
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
          </div>
        )}

        {/* ── Error state ── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-6 py-10">
            <p className="text-sm" style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
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
