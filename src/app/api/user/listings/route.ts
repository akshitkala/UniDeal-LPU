import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'

/**
 * GET: S-04 User Listings (Fix 6).
 * Features: cursor-based pagination (replacing .skip), tab-based status filtering.
 */
export const GET = withAuth(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url)
    
    // Status allows tabs in Dashboard (active | pending | blocked)
    const statusTab = searchParams.get('status') || 'active'
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)

    await connectDB()

    const dbUser = await User.findOne({ uid: user.uid })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Base filter for ownership
    const filter: any = {
      seller: dbUser._id,
      isDeleted: false
    }

    // Apply dashboard tab filter
    if (statusTab === 'active') {
      filter.status = 'approved'
      filter.aiFlagged = false
      filter.isExpired = false
    } else if (statusTab === 'review') {
      filter.$or = [
        { status: 'pending', aiFlagged: false },
        { status: 'approved', aiFlagged: true }
      ]
    } else if (statusTab === 'rejected') {
      filter.status = 'rejected'
    } else if (statusTab === 'sold') {
      filter.status = 'sold'
    }

    // ── CURSOR: use createdAt + _id for stable sorting in Dashboard ────────
    if (cursor) {
      try {
        const { createdAt, _id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
        filter.$or = [
          { createdAt: { $lt: new Date(createdAt) } },
          { createdAt: new Date(createdAt), _id: { $lt: _id } },
        ]
      } catch (e) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
      }
    }

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .select('title price images status bumpedAt lastBumpAt bumpCount expiresAt slug aiFlagged createdAt isExpired sellerBanned')
      .lean()

    const hasNext = listings.length > limit
    const rawData = hasNext ? listings.slice(0, -1) : listings
    
    // Map status for seller visibility (Hide AI terms)
    const data = rawData.map((l: any) => {
      const { aiFlagged, ...rest } = l
      let displayStatus = l.status
      
      if (aiFlagged) {
        displayStatus = 'under_review'
      } else if (l.isExpired) {
        displayStatus = 'expired'
      } else if (l.sellerBanned) {
        displayStatus = 'banned'
      }

      return {
        ...rest,
        status: displayStatus
      }
    })
    
    let nextCursor = null
    if (hasNext && data.length > 0) {
      const lastItem = rawData[rawData.length - 1]
      nextCursor = Buffer.from(JSON.stringify({
        createdAt: lastItem.createdAt,
        _id: lastItem._id
      })).toString('base64')
    }

    return NextResponse.json({
      listings: data,
      nextCursor
    }, { status: 200 })

  } catch (error) {
    console.error('[/api/user/listings GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
