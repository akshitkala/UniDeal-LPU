import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import Report from '@/lib/db/models/Report'
import AdminActivity from '@/lib/db/models/AdminActivity'
import { deleteImage } from '@/lib/utils/cloudinary'
import redis from '@/lib/redis/client'
import { sendListingRejected, sendListingDeleted } from '@/lib/email/resend'

export const PATCH = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const { action, reason } = await req.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    }

    await connectDB()

    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    const listing = await Listing.findOne({ slug }).populate('seller', 'email')
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const previousStatus = listing.status

    if (action === 'approve') {
      listing.status = 'approved'
      listing.aiFlagged = false
      listing.aiUnavailable = false
    } else if (action === 'reject') {
      if (!reason) return NextResponse.json({ error: 'Rejecting requires a reason' }, { status: 400 })
      listing.status = 'rejected'
      listing.aiFlagged = true // Keep it flagged for clarity
    }

    await listing.save()

    // Log to Audit Trail
    await AdminActivity.create({
       actor: adminUser._id,
       actorType: 'user',
       target: listing._id,
       targetModel: 'Listing',
       action: `LISTING_${action.toUpperCase()}`,
       reason: reason || undefined,
       metadata: { previousStatus }
    })

    // Flush Browse Cache (if approved, it hits feed)
    if (action === 'approve') {
       await redis.del('listings:browse:1:12')
    }
    // Flush specific listing detail cache
    await redis.del(`listing:detail:${slug}`)

    if (action === 'reject' && listing.seller && (listing.seller as any).email) {
       await sendListingRejected((listing.seller as any).email, listing.title, reason || 'No reason provided')
    }

    return NextResponse.json({ success: true, listing })
  } catch (error) {
    console.error('[/api/admin/listings/[slug] PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

export const DELETE = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const { searchParams } = new URL(req.url)
    const reason = searchParams.get('reason')

    if (!reason) return NextResponse.json({ error: 'Hard Delete requires a reason' }, { status: 400 })

    await connectDB()

    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    const listing = await Listing.findOne({ slug }).populate('seller', 'email')
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Extract Cloudinary Public IDs
    const deleteImagePromises: Promise<void>[] = []
    if (listing.images && listing.images.length > 0) {
      for (const url of listing.images) {
         try {
           if (url.includes('/unideal_listings/')) {
             const relativePath = url.split('/unideal_listings/')[1]
             const filenameWithoutExt = relativePath.substring(0, relativePath.lastIndexOf('.')) || relativePath
             const publicId = `unideal_listings/${filenameWithoutExt}`
             deleteImagePromises.push(deleteImage(publicId))
           }
         } catch(e) { /* ignore parse errors */ }
      }
    }

    // Await native destruction of AWS payloads
    await Promise.allSettled(deleteImagePromises)

    // Delete associated pending reports
    await Report.deleteMany({ listing: listing._id })

    // Delete document natively (no soft delete for admin override)
    await Listing.findByIdAndDelete(listing._id)

    // Log the catastrophic erasure
    await AdminActivity.create({
       actor: adminUser._id,
       actorType: 'user',
       target: undefined, // the target is wiped, keeping it orphaned or recording slug in metadata
       targetModel: 'Listing',
       action: 'LISTING_HARD_DELETE',
       reason,
       metadata: { slug, title: listing.title, owner: listing.seller }
    })

    // Flush Cache
    await redis.del('listings:browse:1:12')
    await redis.del(`listing:detail:${slug}`)

    if (listing.seller && (listing.seller as any).email) {
       await sendListingDeleted((listing.seller as any).email, listing.title, reason)
    }

    return NextResponse.json({ success: true, message: 'Constructive removal initiated and Cloudinary swept.' })
  } catch (error) {
    console.error('[/api/admin/listings/[slug] DELETE error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
