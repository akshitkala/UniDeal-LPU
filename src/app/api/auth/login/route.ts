import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { connectDB } from '@/lib/db/connect'
import { createIndexes } from '@/lib/db/indexes'
import User from '@/lib/db/models/User'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/auth/cookies'
import AdminActivity from '@/lib/db/models/AdminActivity'
import { sendWelcomeEmail } from '@/lib/email/resend'
import { checkRateLimit } from '@/lib/middleware/rateLimit'
import { headers } from 'next/headers'

let indexesCreated = false

export async function POST(req: NextRequest) {
  try {
    // ── RATE LIMIT (10/hour per IP) ─────────────────────────────────────────
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') ?? 'unknown'
    const rl = await checkRateLimit(`login:${ip}`, 10, 3600)
    
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in 1 hour.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { firebaseIdToken } = body

    if (!firebaseIdToken) {
      return NextResponse.json({ error: 'Firebase ID token required' }, { status: 400 })
    }

    // Verify Firebase Google ID token server-side
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(firebaseIdToken)
    } catch {
      return NextResponse.json({ error: 'Invalid Firebase token' }, { status: 401 })
    }

    const { uid, email, name, picture } = decodedToken

    if (!email) {
      return NextResponse.json({ error: 'Email not available from Google' }, { status: 400 })
    }

    await connectDB()

    // Create indexes on first boot
    if (!indexesCreated) {
      await createIndexes()
      indexesCreated = true
    }

    // Look up or create User in MongoDB
    let user = await User.findOne({ uid })
    const isNewUser = !user

    if (!user) {
      // Default displayName = email prefix (e.g. john.doe@gmail.com → john.doe)
      const displayName = name || email.split('@')[0]
      user = await User.create({
        uid,
        email,
        displayName,
        photoURL: picture || '',
        role: 'user',
        isActive: true,
        trustLevel: 'new',
      })
    }

    // CRITICAL: Banned users cannot log in — return 401
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been banned. Contact support via /contact.' },
        { status: 401 }
      )
    }

    const jwtPayload = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      dbId: user._id.toString(),
    }

    // Issue both tokens
    const accessToken = await signAccessToken(jwtPayload)
    const refreshToken = await signRefreshToken(jwtPayload)

    // Set HTTP-only cookies (SameSite=Strict, Secure in prod)
    await setAccessTokenCookie(accessToken)
    await setRefreshTokenCookie(refreshToken)

    // Log registration for new users
    if (isNewUser) {
      await AdminActivity.create({
        actor: user._id,
        actorType: 'user',
        target: user._id,
        targetModel: 'User',
        action: 'USER_REGISTERED',
        metadata: { email, uid },
        timestamp: new Date(),
      })
      await sendWelcomeEmail(user.email, user.displayName || 'User')
    }

    // CRITICAL: Never include whatsappNumber — response only has safe fields
    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.error('[/api/auth/login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
