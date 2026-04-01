import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const REFRESH_SECRET = process.env.REFRESH_SECRET!

export interface JWTPayload {
  uid: string
  email: string
  role: 'user' | 'admin'
  displayName: string
}

// Access token — 15 minutes TTL
export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

// Refresh token — 7 days TTL
export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload
}
