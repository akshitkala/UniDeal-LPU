import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import { logAction } from '@/lib/utils/logAction'
import { invalidateListing, invalidateBrowseCache } from '@/lib/redis/cache'

/**
 * POST /api/listings/[slug]/sold
 * Marks a listing as sold (Ownership required).
 */
export const POST = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    await connectDB()

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Ownership Check
    if (listing.seller.toString() !== user.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // State validation
    if (listing.status === 'sold') {
      return NextResponse.json({ error: 'Already marked as sold' }, { status: 400 })
    }
    
    if (listing.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved listings can be marked as sold' }, { status: 400 })
    }

    // Update Status
    listing.status = 'sold'
    listing.soldAt = new Date()
    await listing.save()

    // Log Activity
    await logAction('LISTING_SOLD', {
      actor: user.dbId,
      actorType: 'user',
      target: listing._id.toString(),
      targetModel: 'Listing',
      metadata: {
        slug: listing.slug,
        title: listing.title
      }
    })

    // Invalidate Cache
    await invalidateListing(listing.slug)
    await invalidateBrowseCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Listing Sold POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
