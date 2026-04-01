import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import AdminActivity from '@/lib/db/models/AdminActivity'
import redis from '@/lib/redis/client'

export const POST = withAuth(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const userId = user.uid

    // Rate Limiting (50 reveals/user/day)
    const rateLimitKey = `ratelimit:contact:${userId}`
    const currentCount = await redis.incr(rateLimitKey)
    if (currentCount === 1) {
      // Set to expire in 24 hours
      await redis.expire(rateLimitKey, 86400)
    }
    if (currentCount > 50) {
      return NextResponse.json({ error: 'Daily contact limit reached (50 max)' }, { status: 429 })
    }

    await connectDB()

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Check visibility manually just in case
    if (listing.status !== 'approved' || listing.isDeleted || listing.sellerBanned || listing.aiFlagged) {
      return NextResponse.json({ error: 'Listing unavailable' }, { status: 404 })
    }

    // Fetch Seller with explicit +whatsappNumber selection
    const sellerUser = await User.findById(listing.seller).select('+whatsappNumber displayName')
    if (!sellerUser) return NextResponse.json({ error: 'Seller account could not be located' }, { status: 404 })

    // Build Payload Link
    if (!sellerUser.whatsappNumber) {
      return NextResponse.json({ error: 'Seller has not provided a WhatsApp number' }, { status: 400 })
    }

    const cleanNumber = sellerUser.whatsappNumber.replace(/[^0-9]/g, '')
    const message = encodeURIComponent(`Hi ${sellerUser.displayName}, I am interested in your listing: "${listing.title}" on UniDeal. Is it still available?`)
    const waLink = `https://wa.me/${cleanNumber}?text=${message}`

    // Minimal audit logging of the event
    await AdminActivity.create({
      actor: userId,
      actorType: 'user',
      target: listing._id,
      targetModel: 'Listing',
      action: 'CONTACT_REVEALED',
      metadata: { slug }
    })

    return NextResponse.json({ waLink }, { status: 200 })
  } catch (error) {
    console.error('[/api/listings/[slug]/contact POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
