import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import redis from '@/lib/redis/client'
import { CACHE_KEYS, invalidateListing } from '@/lib/redis/cache'
import { withAuth } from '@/lib/middleware/auth'

/**
 * GET /api/listings/[slug]
 * Retrieves a single listing with caching and visibility checks.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // 1. Cache Check
    const cacheKey = CACHE_KEYS.LISTING(slug)
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      Listing.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec()
      return NextResponse.json(cachedData)
    }

    await connectDB()

    // 2. Fetch Listing
    const listing = await Listing.findOne({ slug, isDeleted: false })
      .populate('category', 'name slug icon')
      .populate('seller', 'displayName photoURL trustLevel createdAt +whatsappNumber')
      .lean() as any

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // 3. Visibility Guard
    if (
      listing.status !== 'approved' ||
      listing.sellerBanned ||
      listing.aiFlagged ||
      listing.isExpired
    ) {
      return NextResponse.json({ error: 'Listing unavailable' }, { status: 404 })
    }

    // 4. Cache Detail (30s)
    await redis.set(cacheKey, listing, { ex: 30 })

    // 5. Track View
    Listing.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec()

    return NextResponse.json(listing)
  } catch (error) {
    console.error(`[Listing Detail GET error]`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PATCH /api/listings/[slug]
 * Updates a listing (Ownership required).
 */
export const PATCH = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    await connectDB()

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Ownership Check (Using dbId from JWT)
    if (listing.seller.toString() !== user.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const allowedUpdates = ['title', 'description', 'price', 'negotiable', 'condition']
    
    allowedUpdates.forEach(key => {
      if (body[key] !== undefined) (listing as any)[key] = body[key]
    })

    // Re-verify on edit
    listing.status = 'pending'
    listing.aiFlagged = false

    await listing.save()
    await invalidateListing(slug)

    return NextResponse.json({ success: true, slug: listing.slug })
  } catch (error) {
    console.error('[Listing Detail PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

/**
 * DELETE /api/listings/[slug]
 * Soft-deletes a listing.
 */
export const DELETE = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    await connectDB()

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.seller.toString() !== user.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    listing.isDeleted = true
    await listing.save()
    
    await invalidateListing(slug)
    await User.findByIdAndUpdate(user.dbId, { $inc: { activeListings: -1 } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Listing Detail DELETE error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
