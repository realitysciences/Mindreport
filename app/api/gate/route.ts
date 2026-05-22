import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { password } = body as Record<string, unknown>
  const expected = (process.env.BETA_PASSWORD ?? 'open').trim()

  if (typeof password !== 'string' || password.trim() !== expected) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('mindreport_access', 'granted', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return NextResponse.json({ ok: true })
}
