import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import Report from '@/lib/db/models/Report'
import AdminActivity from '@/lib/db/models/AdminActivity'
import { withAuth } from '@/lib/middleware/auth'
import redis from '@/lib/redis/client'

/**
 * POST /api/listings/[slug]/report
 * Handles reporting a listing.
 * - Rate limits: 10 reports/user/day.
 * - Duplicates: 1 report per user per listing.
 */
export const POST = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    const userId = user.dbId

    // 1. Rate Limiting (10 reports/user/day)
    const rlKey = `ratelimit:report:${userId}`
    const count = await redis.incr(rlKey)
    if (count === 1) await redis.expire(rlKey, 86400)
    if (count > 10) {
      return NextResponse.json({ error: 'Daily report limit reached.' }, { status: 429 })
    }

    const { reason, description } = await req.json()
    if (!reason) return NextResponse.json({ error: 'Reason is required' }, { status: 400 })

    await connectDB()

    // 2. Fetch Listing
    const listing = await Listing.findOne({ slug, isDeleted: false })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // 3. Duplicate check
    const existing = await Report.findOne({ listing: listing._id, reportedBy: userId })
    if (existing) {
      return NextResponse.json({ error: 'You have already reported this listing.' }, { status: 400 })
    }

    // 4. Create Report
    await Report.create({
      listing: listing._id,
      reportedBy: userId,
      reason,
      description: description?.slice(0, 500),
      status: 'pending'
    })

    // 5. Update Listing Stats & Log
    await Listing.findByIdAndUpdate(listing._id, { $inc: { reportCount: 1 } })
    
    await AdminActivity.create({
      actor: userId,
      actorType: 'user',
      target: listing._id,
      targetModel: 'Listing',
      action: 'LISTING_REPORTED',
      metadata: { slug, reason }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/listings/report POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
