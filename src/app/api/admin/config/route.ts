import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import SystemConfig, { getSystemConfig } from '@/lib/db/models/SystemConfig'
import User from '@/lib/db/models/User'
import { logAction } from '@/lib/utils/logAction'

/**
 * GET/PATCH: Global System Configuration (Fix 15).
 */
export const GET = withAdmin(async () => {
  try {
    await connectDB()
    const config = await getSystemConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('[/api/admin/config GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

export const PATCH = withAdmin(async (req, user) => {
  try {
    const body = await req.json()
    const { maintenanceMode, allowNewListings, approvalMode } = body

    await connectDB()
    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

    const updatedConfig = await SystemConfig.findOneAndUpdate(
      { _id: 'global' },
      { 
        $set: { 
          ...(maintenanceMode !== undefined ? { maintenanceMode } : {}),
          ...(allowNewListings !== undefined ? { allowNewListings } : {}),
          ...(approvalMode !== undefined ? { approvalMode } : {}),
          updatedBy: adminUser._id,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    )

    // Log global state changes
    const action = maintenanceMode !== undefined 
      ? 'MAINTENANCE_TOGGLED' 
      : allowNewListings !== undefined 
        ? 'NEW_LISTINGS_TOGGLED'
        : 'CONFIG_UPDATED'

    await logAction(action, {
      actor: adminUser._id,
      metadata: body
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('[/api/admin/config PATCH error]', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
})
