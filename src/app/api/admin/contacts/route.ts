import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import ContactMessage from '@/lib/db/models/ContactMessage'

/**
 * GET: Admin Contact Inbox (Fix 15).
 * Supports status filtering and cursor-based pagination.
 */
export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'open'
    const cursor = searchParams.get('cursor')
    const limit = 20

    await connectDB()

    const filter: any = { status }
    if (cursor) {
      filter._id = { $lt: cursor }
    }

    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasNext = messages.length > limit
    const data = hasNext ? messages.slice(0, -1) : messages
    const nextCursor = hasNext ? messages[limit - 1]._id : null

    return NextResponse.json({ messages: data, nextCursor })
  } catch (error) {
    console.error('[/api/admin/contacts GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
