import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    
    // For MVP Admin, we fetch practically everything that isn't deleted,
    // prioritizing AI flags and pendings
    const statusTab = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const skip = (page - 1) * limit

    await connectDB()

    const filter: any = { isDeleted: false }
    
    if (statusTab === 'pending') {
      filter.status = 'pending'
    } else if (statusTab === 'flagged') {
      filter.aiFlagged = true
    } else if (statusTab === 'live') {
      filter.status = 'approved'
      filter.aiFlagged = false
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ aiFlagged: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('seller', 'displayName email uid photoURL')
        .lean(),
      Listing.countDocuments(filter)
    ])

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('[/api/admin/listings GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
