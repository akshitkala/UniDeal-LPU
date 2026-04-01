import { cookies } from 'next/headers'
import { JWTPayload } from './jwt'

const isProduction = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
}

// Access token: 15 minutes
export async function setAccessTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('access_token', token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 15, // 15 minutes in seconds
  })
}

// Refresh token: 7 days
export async function setRefreshTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('refresh_token', token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  })
}

// Clear both cookies on logout or ban
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('access_token', '', { ...COOKIE_OPTIONS, maxAge: 0 })
  cookieStore.set('refresh_token', '', { ...COOKIE_OPTIONS, maxAge: 0 })
}

// Read access token value (for middleware/route handlers)
export function getAccessTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/access_token=([^;]+)/)
  return match ? match[1] : null
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/refresh_token=([^;]+)/)
  return match ? match[1] : null
}
