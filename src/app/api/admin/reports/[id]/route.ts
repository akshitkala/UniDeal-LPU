import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Report from '@/lib/db/models/Report'
import { logAction } from '@/lib/utils/logAction'
import User from '@/lib/db/models/User'

/**
 * PATCH: Resolve or Dismiss a Report (Fix 15).
 */
export const PATCH = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { id } = await context.params

    const body = await req.json()
    const { action, note } = body

    if (!['dismiss', 'resolve'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await connectDB()
    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

    const updatedStatus = action === 'dismiss' ? 'dismissed' : 'reviewed'
    
    const report = await Report.findByIdAndUpdate(id, {
      status: updatedStatus,
      reviewedBy: adminUser._id
    })

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    // Log the audit trail (Fix 8 requirement concept applied here)
    await logAction(action === 'dismiss' ? 'REPORT_DISMISSED' : 'REPORT_REVIEWED', {
      actor: adminUser._id,
      target: id,
      targetModel: 'Report',
      metadata: { note, status: updatedStatus }
    })

    return NextResponse.json({ success: true, status: updatedStatus })
  } catch (error) {
    console.error('[/api/admin/reports/[id] PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
