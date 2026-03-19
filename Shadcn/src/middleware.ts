import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // In demo mode, bypass all Supabase auth checks
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const { pathname } = request.nextUrl

    // Redirect root to login so users see the "Try Demo" button
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow everything through — no auth required in demo mode
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
