import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt'
import { setAccessTokenCookie, getRefreshTokenFromRequest } from '@/lib/auth/cookies'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req)

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
    }

    // Re-check ban status on every refresh — critical for banned users
    await connectDB()
    const user = await User.findOne({ uid: payload.uid }).select('isActive role displayName')

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Account is banned or not found' },
        { status: 401 }
      )
    }

    // Issue fresh access token with latest role (role may have changed)
    const newAccessToken = signAccessToken({
      uid: payload.uid,
      email: payload.email,
      role: user.role,
      displayName: user.displayName,
    })

    await setAccessTokenCookie(newAccessToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/refresh]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
