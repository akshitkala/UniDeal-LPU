import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export const GET = withAuth(async (req, user) => {
  try {
    await connectDB()

    // Select specifically the excluded field using '+whatsappNumber' to test its existence
    // without returning it to the client
    const dbUser = await User.findOne({ uid: user.uid }).select('+whatsappNumber').lean()
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hasWhatsapp = !!dbUser.whatsappNumber && dbUser.whatsappNumber.trim().length > 0

    return NextResponse.json({ hasWhatsapp }, { status: 200 })
  } catch (error) {
    console.error('[/api/user/whatsapp-status GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
