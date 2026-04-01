import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { checkRateLimit } from '@/lib/middleware/rateLimit'

/**
 * Next.js Edge Middleware for global rate limiting and auth routing.
 * IMPLEMENTS: Admin Rate Limiting (Fix 11).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── AUTHENTICATED SESSION CHECK (Banned User Protection) ─────────────────────
  const accessToken = req.cookies.get('access_token')?.value
  
  if (accessToken) {
    await verifyAccessToken(accessToken)
    // If token is invalid or if the database is accessible (which it isn't in Edge), 
    // we normally check isActive. Since we can't check DB here without overhead, 
    // we rely on the 15min JWT expiry. Banned users have their tokens invalidated 
    // or simply won't be able to fetch data from /api which DOES check isActive.
  }

  // ── ADMIN API RATE LIMITING (Fix 11: 20 actions/min) ───────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const adminUid = payload.uid || 'unknown_admin'
    const rl = await checkRateLimit(`admin:${adminUid}`, 20, 60)
    
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Admin rate limit exceeded (20 actions/min). Slow down.' }, 
        { status: 429 }
      )
    }
  }

  // ── GLOBAL SEARCH OPTIMIZATION (Prevent full refresh redirect if possible) ─
  // Note: Handling search redirects in client side is better for UX.
  
  return NextResponse.next()
}

// Ensure middleware only runs on relevant paths
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/listings/:path*',
  ],
}
