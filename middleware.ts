import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const access = request.cookies.get('mindreport_access')?.value

  if (access !== 'granted') {
    const url = request.nextUrl.clone()
    url.pathname = '/gate'
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/your-map', '/your-map/:path*'],
}
