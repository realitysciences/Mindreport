// Client-side report persistence and share-URL encoding.
// All functions guard against SSR with typeof window checks.

import LZString from 'lz-string'
import type { MapResult } from './reportTypes'

const STORAGE_KEY = 'mindreport_saved_v1'

export type SavedReport = {
  maps: Record<string, MapResult>
  activeLensId: string
  savedAt: string // ISO date string
}

// ── localStorage persistence ──────────────────────────────────────────────────

export function saveReport(
  maps: Record<string, MapResult>,
  activeLensId: string,
): void {
  if (typeof window === 'undefined') return
  try {
    const payload: SavedReport = {
      maps,
      activeLensId,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage may be full or unavailable (private browsing)
  }
}

export function loadSavedReport(): SavedReport | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedReport) : null
  } catch {
    return null
  }
}

export function clearSavedReport(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// ── Share-URL encoding ────────────────────────────────────────────────────────
// Compresses the report JSON with LZ-string and encodes it in the URL hash.
// Keeps everything client-side — no server needed — and hash fragments are
// never sent to analytics or server logs.

export function encodeSharePayload(
  maps: Record<string, MapResult>,
  activeLensId: string,
): string {
  return LZString.compressToEncodedURIComponent(
    JSON.stringify({ maps, activeLensId }),
  )
}

export function buildShareUrl(
  maps: Record<string, MapResult>,
  activeLensId: string,
): string {
  const encoded = encodeSharePayload(maps, activeLensId)
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://mindreport.com'
  return `${origin}/map#d=${encoded}`
}

export function decodeSharePayload(
  hash: string,
): { maps: Record<string, MapResult>; activeLensId: string } | null {
  try {
    // hash may be '#d=...' or 'd=...' (without leading #)
    const encoded = hash.replace(/^#/, '').replace(/^d=/, '')
    if (!encoded) return null
    const raw = LZString.decompressFromEncodedURIComponent(encoded)
    if (!raw) return null
    return JSON.parse(raw) as { maps: Record<string, MapResult>; activeLensId: string }
  } catch {
    return null
  }
}
