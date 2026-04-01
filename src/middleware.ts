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

  // ── ADMIN API RATE LIMITING (Fix 11: 20 actions/min) ───────────────────────
  if (pathname.startsWith('/api/admin')) {
    // 1. Verify access token from cookies
    const accessToken = req.cookies.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyAccessToken(accessToken)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Apply rate limit keyed by admin UID
    const adminUid = payload.uid || 'unknown_admin'
    const rl = await checkRateLimit(`admin:${adminUid}`, 20, 60)
    
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Admin rate limit exceeded (20 actions/min). Slow down.' }, 
        { status: 429 }
      )
    }
  }

  // ── USER API RATE LIMITING (Safety Layer) ──────────────────────────────────
  if (pathname.startsWith('/api/listings') && req.method === 'POST') {
    // Basic IP rate limiting for listing creation (already handled in route but this adds Edge protection)
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const rl = await checkRateLimit(`ip_post:${ip}`, 5, 86400)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Daily ip limit reached.' }, { status: 429 })
    }
  }

  return NextResponse.next()
}

// Ensure middleware only runs on relevant paths
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/listings/:path*',
  ],
}
