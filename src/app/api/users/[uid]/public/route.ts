import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'

/**
 * GET: S-09 Public Profile (Fix 16).
 * Features: strictly select public fields (PII protection), Member ID verification.
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params
    await connectDB()

    // 1. Fetch Seller Public Data
    // whatsappNumber is select:false, so it's protected by default
    const seller = await User.findOne({ uid })
      .select('displayName photoURL bio createdAt role isLpuVerified')
      .lean()

    if (!seller) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 2. Fetch Seller Approved Listings
    // Uses mandatory 4-condition visibility filter
    const listings = await Listing.find({
      seller: seller._id,
      status: 'approved',
      isDeleted: false,
      sellerBanned: false,
      aiFlagged: false,
      isExpired: false,
    })
    .select('title price images condition slug bumpedAt')
    .sort({ bumpedAt: -1 })
    .lean()

    return NextResponse.json({ seller, listings })
  } catch (error) {
    console.error('[/api/users/[uid]/public GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
