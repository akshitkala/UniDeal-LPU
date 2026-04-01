import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 50
    const skip = (page - 1) * limit
    
    // Quick search by email or name
    const q = searchParams.get('q')
    const filter: any = {}
    if (q) {
      filter.$or = [
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }

    await connectDB()

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ])

    // Fetch listing counts for each user concurrently
    const userPayloads = await Promise.all(users.map(async (u) => {
       const listingCount = await Listing.countDocuments({ seller: u._id, isDeleted: false })
       return { ...u, listingCount }
    }))

    return NextResponse.json({
      users: userPayloads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('[/api/admin/users GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
