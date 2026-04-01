import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth/cookies'

export async function POST() {
  try {
    await clearAuthCookies()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/logout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
