import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // In demo mode, bypass all Supabase auth checks
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    // Redirect root directly to the platform dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/platform/dashboard', request.url))
    }
    // Allow everything through — no auth required in demo mode
    return NextResponse.next()
  }

  // Production: redirect root based on auth state
  if (pathname === '/') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
