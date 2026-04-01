import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import AdminActivity from '@/lib/db/models/AdminActivity'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    await connectDB()

    const [logs, total] = await Promise.all([
      AdminActivity.find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'displayName email uid isLpuVerified')
        .lean(),
      AdminActivity.countDocuments({})
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('[/api/admin/audit GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
