import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Report from '@/lib/db/models/Report'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'

/**
 * GET: List Reports for Admin (A-03).
 * Supports status filtering, page-based pagination, and deep population.
 */
export const GET = withAdmin(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') || 'pending') as any
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    await connectDB()

    const filter: any = status === 'all' ? {} : { status }
    
    // Fetch reports with deep population
    // Note: listing populate must handle safety; whatsappNumber is select:false by default
    const reports = await Report.find(filter)
      .populate('reportedBy', 'uid email displayName photoURL createdAt')
      .populate({
        path: 'listing',
        select: 'title slug images price condition status seller createdAt isDeleted sellerBanned',
        populate: {
          path: 'seller',
          select: 'uid email displayName'
        }
      })
      .populate('reviewedBy', 'displayName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch counts for the badge/tabs
    const [pending, reviewed, dismissed] = await Promise.all([
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'reviewed' }),
      Report.countDocuments({ status: 'dismissed' })
    ])

    return NextResponse.json({ 
      reports, 
      counts: { pending, reviewed, dismissed } 
    })
  } catch (error) {
    console.error('[/api/admin/reports GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
