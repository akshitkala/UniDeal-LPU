import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import Category from '@/lib/db/models/Category'
import User from '@/lib/db/models/User'
import redis from '@/lib/redis/client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Quick cache check to save DB hits for hot items
    const cacheKey = `listing:detail:${slug}`
    const cachedData = await redis.get(cacheKey)
    if (cachedData) {
      // Async view increment
      Listing.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec()
      return NextResponse.json(cachedData)
    }

    await connectDB()

    const listing = await Listing.findOne({ slug })
      .populate('category', 'name slug icon')
      .populate('seller', 'displayName photoURL trustLevel createdAt +whatsappNumber') // Include +whatsappNumber for waLink gen
      .lean() as any

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Construct WhatsApp deep link server-side — raw number is never sent to UI
    if (listing.seller && listing.seller.whatsappNumber) {
        const cleanNumber = listing.seller.whatsappNumber.replace(/\D/g, '')
        listing.seller.waLink = `https://wa.me/${cleanNumber}?text=Hi, I am interested in your listing: ${listing.title} on UniDeal.`
        delete listing.seller.whatsappNumber // Physically prune the number from payload
    }

    // MANDATORY 4-condition visibility filter applied retrospectively for direct access links
    // If a listing has been banned or soft-deleted, direct links should be 404
    if (
      listing.status !== 'approved' ||
      listing.isDeleted ||
      listing.sellerBanned ||
      listing.aiFlagged ||
      listing.isExpired
    ) {
      return NextResponse.json({ error: 'Listing unavailable' }, { status: 404 })
    }

    // Cache the detail view for 30s
    await redis.set(cacheKey, listing, { ex: 30 })

    // Increment views in background
    Listing.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec()

    return NextResponse.json(listing)
  } catch (error) {
    console.error(`[/api/listings/[slug] GET error]`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { withAuth } from '@/lib/middleware/auth'

export const PATCH = withAuth(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const params = await context.params
    const slug = params.slug

    await connectDB()
    const dbUser = await User.findOne({ uid: user.uid })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Ownership Check
    if (listing.seller.toString() !== dbUser._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized to edit this listing' }, { status: 403 })
    }

    const body = await req.json()
    // Simplified MVP edit logic (text fields only for stability)
    if (body.title) listing.title = body.title
    if (body.description) listing.description = body.description
    if (body.price) listing.price = Number(body.price)
    if (typeof body.negotiable === 'boolean') listing.negotiable = body.negotiable
    if (body.condition) listing.condition = body.condition

    // Re-verify if changed
    listing.status = 'pending'
    listing.aiFlagged = false

    await listing.save()

    // Flush cache
    await redis.del(`listing:detail:${slug}`)
    // We should ideally scan and delete `feed:browse:*` keys, but for MVP standard expiry handles it

    return NextResponse.json({ success: true, slug: listing.slug })
  } catch (error) {
    console.error('[/api/listings/[slug] PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const params = await context.params
    const slug = params.slug

    await connectDB()
    const dbUser = await User.findOne({ uid: user.uid })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Ownership Check
    if (listing.seller.toString() !== dbUser._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized to delete this listing' }, { status: 403 })
    }

    // Soft delete
    listing.isDeleted = true
    await listing.save()

    // Flush cache
    await redis.del(`listing:detail:${slug}`)

    // Update user stats
    await User.findByIdAndUpdate(dbUser._id, { $inc: { activeListings: -1 } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/listings/[slug] DELETE error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
