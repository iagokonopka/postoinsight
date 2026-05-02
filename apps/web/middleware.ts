import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ['/login']

export default auth((req) => {
  const isAuthed = !!req.auth
  const { pathname, search } = req.nextUrl

  // Already-authed users on /login → send to dashboard
  if (isAuthed && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  if (!isAuthed) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

// Run middleware on all routes except API, Next internals and static files.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)'],
}
