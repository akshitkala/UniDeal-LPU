import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import redis from '@/lib/redis/client'
import { invalidateBrowseCache } from '@/lib/redis/cache'

export const POST = withAuth(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const userId = user.uid

    await connectDB()

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

    // ATOMIC BUMP (Fix RACE-001): Atomic check-and-update prevents race conditions
    const listing = await Listing.findOneAndUpdate(
      { 
        slug, 
        seller: user.dbId,
        status: 'approved',
        isDeleted: false,
        aiFlagged: false,
        bumpCount: { $lt: 3 },
        $or: [
          { lastBumpAt: { $exists: false } },
          { lastBumpAt: { $lte: sevenDaysAgo } }
        ]
      },
      { 
        $set: { 
          bumpedAt: now, 
          lastBumpAt: now,
          expiresAt: expiresAt
        },
        $inc: { bumpCount: 1 }
      },
      { new: true }
    )

    if (!listing) {
      // If none found, either listing doesn't exist, not owned, or cooldown/limit active
      // We can do a secondary check to return a specific error message if needed, 
      // but for atomic performance, a generic fail is safer for high-frequency attempts.
      return NextResponse.json({ 
        error: 'Bump unavailable. Listing may be on cooldown, reached max bumps (3/3), or is not approved.' 
      }, { status: 400 })
    }

    // Flush Redis Detail Cache
    await redis.del(`listing:detail:${slug}`)
    await invalidateBrowseCache()

    return NextResponse.json({ 
      success: true,
      bumpsRemaining: 3 - listing.bumpCount,
      nextBumpAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('[/api/listings/[slug]/bump POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
