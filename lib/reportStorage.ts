// Share-URL encoding for report data.
// Compresses report JSON with LZ-string into a URL hash fragment —
// no server required, hash fragments are never sent to analytics or logs.

import LZString from 'lz-string'
import type { MapResult } from './reportTypes'

export function buildShareUrl(
  maps: Record<string, MapResult>,
  activeLensId: string,
): string {
  const encoded = LZString.compressToEncodedURIComponent(
    JSON.stringify({ maps, activeLensId }),
  )
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://mindreport.com'
  return `${origin}/map#d=${encoded}`
}

export function decodeSharePayload(
  hash: string,
): { maps: Record<string, MapResult>; activeLensId: string } | null {
  try {
    const encoded = hash.replace(/^#/, '').replace(/^d=/, '')
    if (!encoded) return null
    const raw = LZString.decompressFromEncodedURIComponent(encoded)
    if (!raw) return null
    return JSON.parse(raw) as { maps: Record<string, MapResult>; activeLensId: string }
  } catch {
    return null
  }
}
