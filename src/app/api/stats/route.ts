import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import Category from '@/lib/db/models/Category'
import redis from '@/lib/redis/client'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes

/**
 * GET /api/stats
 * Returns aggregate marketplace stats with Redis caching.
 * Public access for homepage hero.
 */
export async function GET() {
  try {
    const CACHE_KEY = 'stats:homepage'
    const CACHE_TTL = 300 // 5 minutes

    // 1. Try Cache
    const cached = await redis.get(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // 2. Cache Miss: Query DB
    await connectDB()

    const [activeListings, totalUsers, totalCategories] = await Promise.all([
      Listing.countDocuments({ 
        status: 'approved', 
        isDeleted: false, 
        sellerBanned: false, 
        aiFlagged: false, 
        isExpired: false 
      }),
      User.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true })
    ])

    const stats = {
      activeListings,
      totalUsers,
      totalCategories
    }

    // 3. Write to Cache
    await redis.set(CACHE_KEY, stats, { ex: CACHE_TTL })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[/api/stats GET error]', error)
    return NextResponse.json({ error: 'Stats unavailable' }, { status: 500 })
  }
}
