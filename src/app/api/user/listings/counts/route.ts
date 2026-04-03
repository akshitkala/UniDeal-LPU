import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'

/**
 * GET: Get counts for dashboard tabs.
 * buckets: active | review | rejected | sold
 */
export const GET = withAuth(async (req, user) => {
  try {
    await connectDB()

    const dbUser = await User.findOne({ uid: user.uid })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [active, review, rejected, sold] = await Promise.all([
      Listing.countDocuments({
        seller: dbUser._id,
        status: 'approved',
        aiFlagged: false,
        isDeleted: false,
        isExpired: false
      }),
      Listing.countDocuments({
        seller: dbUser._id,
        $or: [
          { status: { $in: ['pending', 'under_review'] } },
          { aiFlagged: true, status: 'approved' }
        ],
        isDeleted: false
      }),
      Listing.countDocuments({
        seller: dbUser._id,
        status: 'rejected',
        isDeleted: false
      }),
      Listing.countDocuments({
        seller: dbUser._id,
        status: 'sold',
        isDeleted: false
      })
    ])

    return NextResponse.json({
      active,
      review,
      rejected,
      sold
    })
  } catch (error) {
    console.error('[/api/user/listings/counts GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
