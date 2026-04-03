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
    
    const q = searchParams.get('q')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'newest'

    const filter: any = {}
    if (q) {
      filter.$or = [
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }

    if (role && ['admin', 'user'].includes(role)) {
      filter.role = role
    }

    if (status === 'active') {
      filter.isActive = true
    } else if (status === 'banned') {
      filter.isActive = false
    }

    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      listings: { totalListings: -1 },
      alpha: { displayName: 1 },
    }

    await connectDB()

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ])

    // For the UI, we'll use the already populated totalListings or listingCount
    const userPayloads = users.map(u => ({
      ...u,
      listingCount: u.totalListings || 0
    }))

    return NextResponse.json({
      users: userPayloads,
      total,
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
