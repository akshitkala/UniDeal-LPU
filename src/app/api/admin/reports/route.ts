import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Report from '@/lib/db/models/Report'

/**
 * GET: List Reports for Admin (Fix 15).
 * Supports status filtering and cursor-based pagination.
 */
export const GET = withAdmin(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const cursor = searchParams.get('cursor')
    const limit = 20

    await connectDB()

    const filter: any = { status }
    
    // Cursor-based pagination using _id
    if (cursor) {
      filter._id = { $lt: cursor }
    }

    const reports = await Report.find(filter)
      .populate('listing', 'title slug images')
      .populate('reportedBy', 'displayName email')
      .sort({ createdAt: -1, _id: -1 }) // Double sort for stability
      .limit(limit + 1)
      .lean()

    const hasNext = reports.length > limit
    const data = hasNext ? reports.slice(0, -1) : reports
    const nextCursor = hasNext ? reports[limit - 1]._id : null

    return NextResponse.json({ reports: data, nextCursor })
  } catch (error) {
    console.error('[/api/admin/reports GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
