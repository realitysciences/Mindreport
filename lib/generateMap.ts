// API client for /api/generate-map.
// Reads the streaming response and extracts the framed JSON result.
// Raw server bytes are never surfaced to the UI — debug info goes to console only.

import type { MapResult } from '@/lib/reportTypes'

const RESULT_MARKER = '\nMINDREPORT_RESULT:'
const ERROR_MARKER  = '\nMINDREPORT_ERROR:'

export async function fetchMap(
  transcript: string,
  lens: string,
  subject: string,
): Promise<MapResult> {
  const res = await fetch('/api/generate-map', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ transcript, lens, subject }),
  })

  if (!res.body) throw new Error(`Server error (${res.status}). Please try again.`)

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
  }

  const resultIdx = buffer.indexOf(RESULT_MARKER)
  const errorIdx  = buffer.indexOf(ERROR_MARKER)

  if (resultIdx !== -1) {
    return JSON.parse(buffer.slice(resultIdx + RESULT_MARKER.length)) as MapResult
  }

  if (errorIdx !== -1) {
    throw new Error(buffer.slice(errorIdx + ERROR_MARKER.length) || 'Generation failed.')
  }

  // No frame marker — generation was cut off (likely a timeout).
  // Log bytes/preview for debugging; surface a helpful message to the user.
  console.error('[generateMap] No result marker in response.', {
    bytes:   buffer.length,
    preview: buffer.slice(0, 120),
  })
  throw new Error('The map took too long to generate. Please try again — it usually works on the second attempt.')
}

export function normalizeError(raw: string): string {
  return raw.includes('not valid JSON') || raw.includes('Unexpected token')
    ? 'Map generation failed. Please try again.'
    : raw
}
