import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import ContactMessage from '@/lib/db/models/ContactMessage'
import { logAction } from '@/lib/utils/logAction'
import User from '@/lib/db/models/User'

/**
 * PATCH: Mark Contact Inquiry as Resolved (Fix 15).
 */
export const PATCH = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { id } = await context.params

    await connectDB()
    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    const updated = await ContactMessage.findByIdAndUpdate(id, { 
      status: 'resolved' 
    })

    if (!updated) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    await logAction('CONTACT_RESOLVED', { 
      actor: adminUser._id,
      target: id,
      targetModel: 'ContactMessage'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/admin/contacts/[id] PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
