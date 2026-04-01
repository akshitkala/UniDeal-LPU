import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import AdminActivity from '@/lib/db/models/AdminActivity'

export const GET = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const { searchParams } = new URL(req.url)
    const reason = searchParams.get('reason')

    if (!reason) {
      return NextResponse.json({ error: 'Mandatory reason required for contact reveal' }, { status: 400 })
    }

    await connectDB()

    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    // Find listing by slug to match the parent route pattern
    const listing = await Listing.findOne({ slug }).populate('seller', '+whatsappNumber')
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const seller = listing.seller as any
    if (!seller || !seller.whatsappNumber) {
      return NextResponse.json({ error: 'WhatsApp number not registered for this seller' }, { status: 404 })
    }

    // AUDIT LOG: Crucial security tracing for PII access
    await AdminActivity.create({
      actor: adminUser._id,
      actorType: 'user',
      target: listing._id,
      targetModel: 'Listing',
      action: 'ADMIN_CONTACT_REVEAL',
      reason,
      metadata: { 
        sellerId: seller._id,
        listingTitle: listing.title,
        sellerEmail: seller.email,
        slug
      }
    })

    return NextResponse.json({ whatsappNumber: seller.whatsappNumber }, { status: 200 })
  } catch (error) {
    console.error('[/api/admin/listings/[slug]/contact GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
