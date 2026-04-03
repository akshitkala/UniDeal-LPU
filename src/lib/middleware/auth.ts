import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JWTPayload } from '@/lib/auth/jwt'

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

/**
 * Auth middleware — reads access_token cookie, verifies JWT, checks isActive.
 * Returns 401 if token is missing, invalid, or user is banned.
 * Attaches decoded user payload to request context via header.
 */
export function withAuth(
  handler: (req: NextRequest, user: JWTPayload, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    try {
      const cookieHeader = req.headers.get('cookie') || ''
      const tokenMatch = cookieHeader.match(/access_token=([^;]+)/)
      const token = tokenMatch ? tokenMatch[1] : null

      if (!token) {
        return NextResponse.json({ error: 'Unauthorised — no token' }, { status: 401 })
      }

      const payload = await verifyAccessToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorised — invalid or expired token' }, { status: 401 })
      }

      return handler(req, payload, context)
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorised — session verification failure' }, { status: 401 })
    }
  }
}

/**
 * Admin middleware — must be used after withAuth.
 * Returns 403 if user role is not 'admin'.
 */
export function withAdmin(
  handler: (req: NextRequest, user: JWTPayload, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return withAuth(async (req, user, context) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
    }
    return handler(req, user, context)
  })
}

/**
 * Utility to get user from request without enforcing auth.
 * Returns null if no valid token is found.
 */
export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const tokenMatch = cookieHeader.match(/access_token=([^;]+)/)
    const token = tokenMatch ? tokenMatch[1] : null

    if (!token) return null
    return await verifyAccessToken(token)
  } catch {
    return null
  }
}
