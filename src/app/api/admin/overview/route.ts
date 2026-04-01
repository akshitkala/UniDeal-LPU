import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'
import Report from '@/lib/db/models/Report'
import AdminActivity from '@/lib/db/models/AdminActivity'

export const GET = withAdmin(async (req, user) => {
  try {
    await connectDB()

    // Run core aggregation queries in massive parallel Promise.all 
    const [
      totalUsers,
      activeListings,
      pendingListings,
      openReports,
      pendingQueue,
      recentActivity
    ] = await Promise.all([
      User.countDocuments({}),
      Listing.countDocuments({ status: 'approved', isDeleted: false }),
      Listing.countDocuments({ status: 'pending', isDeleted: false }),
      Report.countDocuments({ status: 'pending' }),
      
      // Top 5 urgent moderation queue tickets (prioritising AI Flags)
      Listing.find({ status: 'pending', isDeleted: false })
             .sort({ aiFlagged: -1, createdAt: 1 })
             .limit(5)
             .populate('seller', 'displayName email uid isLpuVerified')
             .lean(),
             
      // Top 10 latest administration audit traces
      AdminActivity.find({})
             .sort({ timestamp: -1 })
             .limit(10)
             .populate('actor', 'displayName email role')
             .lean()
    ])

    return NextResponse.json({
      stats: { totalUsers, activeListings, pendingListings, openReports },
      pendingQueue,
      recentActivity
    }, { status: 200 })

  } catch (error) {
    console.error('[/api/admin/overview GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
