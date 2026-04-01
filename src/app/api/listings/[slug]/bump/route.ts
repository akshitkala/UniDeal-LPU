import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import redis from '@/lib/redis/client'

export const POST = withAuth(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const userId = user.uid

    await connectDB()

    const dbUser = await User.findOne({ uid: userId })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.seller.toString() !== dbUser._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized to bump this listing' }, { status: 403 })
    }

    if (listing.status !== 'approved' || listing.isDeleted || listing.aiFlagged) {
      return NextResponse.json({ error: 'Cannot bump an unapproved or deleted listing' }, { status: 400 })
    }

    // Cooldown logic
    if (listing.bumpCount >= 3) {
      return NextResponse.json({ error: 'Max bumps reached (3/3)' }, { status: 400 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (listing.lastBumpAt && listing.lastBumpAt > sevenDaysAgo) {
      const nextBumpAt = new Date(listing.lastBumpAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      return NextResponse.json({ 
        error: `Bump on cooldown. Next bump available at: ${nextBumpAt.toISOString()}` 
      }, { status: 400 })
    }

    // Apply Bump
    listing.bumpedAt = now
    listing.lastBumpAt = now
    listing.bumpCount += 1
    listing.expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // Extends expiry by 60 days

    await listing.save()

    // Flush Redis Detail Cache
    await redis.del(`listing:detail:${slug}`)

    // Compute remaining bumps and next availability
    const bumpsRemaining = 3 - listing.bumpCount
    const nextBumpAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return NextResponse.json({ 
      success: true,
      bumpsRemaining,
      nextBumpAt: nextBumpAt.toISOString()
    })

  } catch (error) {
    console.error('[/api/listings/[slug]/bump POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
