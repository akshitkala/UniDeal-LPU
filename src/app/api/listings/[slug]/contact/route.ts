import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import AdminActivity from '@/lib/db/models/AdminActivity'
import redis from '@/lib/redis/client'
import { withAuth } from '@/lib/middleware/auth'

/**
 * POST /api/listings/[slug]/contact
 * Handles the "Reveal Contact" flow for logged-in users.
 * - Rate limits to 50 reveals per day.
 * - Records activity for audit.
 * - Returns a direct wa.me link.
 */
export const POST = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    const userId = user.uid

    // 1. Rate Limiting (50 contact reveals/user/day)
    const rateLimitKey = `ratelimit:contact:${userId}`
    const currentCount = await redis.incr(rateLimitKey)
    if (currentCount === 1) await redis.expire(rateLimitKey, 86400)
    
    if (currentCount > 50) {
      return NextResponse.json({ error: 'Daily contact limit reached (50 max). Try again tomorrow.' }, { status: 429 })
    }

    await connectDB()

    // 2. Fetch Listing
    const listing = await Listing.findOne({ slug, isDeleted: false }).select('seller')
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // 3. Fetch Seller's WhatsApp (Explicitly select protected field)
    const seller = await User.findById(listing.seller).select('+whatsappNumber')
    if (!seller || !seller.whatsappNumber) {
      return NextResponse.json({ error: 'no_number' }, { status: 404 })
    }

    // 4. Log Activity
    await AdminActivity.create({
      actor: user.dbId,
      actorType: 'user',
      target: listing._id,
      targetModel: 'Listing',
      action: 'CONTACT_REVEALED',
      metadata: { slug }
    })

    // 5. Generate Link
    const waLink = `https://wa.me/91${seller.whatsappNumber}`

    return NextResponse.json({ waLink })
  } catch (error) {
    console.error('[/api/listings/contact POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
