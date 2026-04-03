import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    
    // For MVP Admin, we fetch practically everything that isn't deleted,
    // prioritizing AI flags and pendings
    const status = searchParams.get('status') || 'all'
    const aiFlag = searchParams.get('aiFlag') || 'all'
    const sort = searchParams.get('sort') || 'newest'
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const skip = (page - 1) * limit

    await connectDB()

    const filter: any = { isDeleted: false }

    // Status Filter
    if (status !== 'all') {
      filter.status = status
    }

    // AI Flag Filter
    if (aiFlag === 'flagged') {
      filter.aiFlagged = true
    } else if (aiFlag === 'no') {
      filter.aiFlagged = false
    } else if (aiFlag === 'unavailable') {
      filter.aiVerification = { $exists: false }
    }

    // Search Query (Title, Slug, ID, or Seller)
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } }
      ]
      // If it looks like a MongoDB ID, try searching by it
      if (q.match(/^[0-9a-fA-F]{24}$/)) {
        filter.$or.push({ _id: q })
      }
    }

    // Sorting Logic
    let sortOptions: any = { createdAt: -1 }
    if (sort === 'oldest') sortOptions = { createdAt: 1 }
    else if (sort === 'price_high') sortOptions = { price: -1 }
    else if (sort === 'price_low') sortOptions = { price: 1 }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort(sortOptions)
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
