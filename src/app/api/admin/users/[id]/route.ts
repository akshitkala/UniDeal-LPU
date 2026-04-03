import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'
import AdminActivity from '@/lib/db/models/AdminActivity'
import redis from '@/lib/redis/client'
import { sendAccountBanned, sendAccountDeleted } from '@/lib/email/resend'
import { invalidateBrowseCache } from '@/lib/redis/cache'

export const PATCH = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { id } = await context.params
    const { action, reason } = await req.json()

    if (!['ban', 'unban'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action for user modification' }, { status: 400 })
    }

    if (action === 'ban' && !reason) {
      return NextResponse.json({ error: 'Immediate Bans require a mandatory reason' }, { status: 400 })
    }

    await connectDB()

    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    const targetUser = await User.findById(id)
    if (!targetUser) return NextResponse.json({ error: 'User record not found' }, { status: 404 })

    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Root clearance denied — Admins cannot be modified via HTTP.' }, { status: 403 })
    }

    const previousStatus = targetUser.isActive

    // ATOMIC MODIFICATION: The Ban Flow
    if (action === 'ban') {
      targetUser.isActive = false // Blocks future JWT handshakes at login endpoints

      // Propagate cascading "sellerBanned" flag to all active listings, killing them natively from queries
      await Listing.updateMany(
         { seller: targetUser._id },
         { $set: { sellerBanned: true } }
      )
    } 
    // UNBAN FLOW:
    else if (action === 'unban') {
      targetUser.isActive = true

      // Reverse cascade
      await Listing.updateMany(
         { seller: targetUser._id },
         { $set: { sellerBanned: false } }
      )
    }

    await targetUser.save()

    // Create Audit Vector
    await AdminActivity.create({
       actor: adminUser._id,
       actorType: 'user',
       target: targetUser._id,
       targetModel: 'User',
       action: action === 'ban' ? 'USER_BANNED' : 'USER_UNBANNED',
       reason: reason || undefined,
       metadata: { previousStatus, email: targetUser.email }
    })

    // Flushes all global directory cache endpoints since a volume of listings just disappeared/re-appeared simultaneously
    await invalidateBrowseCache()

    if (action === 'ban' && targetUser.email) {
       await sendAccountBanned(targetUser.email, reason!)
    }

    return NextResponse.json({ success: true, user: targetUser })
  } catch (error) {
    console.error('[/api/admin/users/[id] PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

import Report from '@/lib/db/models/Report'
import { deleteImage } from '@/lib/utils/cloudinary'

export const DELETE = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { id } = await context.params

    await connectDB()

    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    const targetUser = await User.findById(id)
    if (!targetUser) return NextResponse.json({ error: 'User record not found' }, { status: 404 })

    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Root clearance denied.' }, { status: 403 })
    }

    const userListings = await Listing.find({ seller: targetUser._id })

    const deleteImagePromises: Promise<void>[] = []
    for (const listing of userListings) {
      if (listing.images && listing.images.length > 0) {
        for (const url of listing.images) {
           try {
             if (url.includes('/unideal_listings/')) {
               const relativePath = url.split('/unideal_listings/')[1]
               const filenameWithoutExt = relativePath.substring(0, relativePath.lastIndexOf('.')) || relativePath
               const publicId = `unideal_listings/${filenameWithoutExt}`
               deleteImagePromises.push(deleteImage(publicId))
             }
           } catch(e) {}
        }
      }
    }

    await Promise.allSettled(deleteImagePromises)
    await Listing.deleteMany({ seller: targetUser._id })
    await Report.deleteMany({ reportedBy: targetUser._id })

    await AdminActivity.create({
       actor: adminUser._id,
       actorType: 'user',
       target: undefined,
       targetModel: 'System',
       action: 'USER_CASCADE_DELETE',
       reason: 'Admin Override Cascade Sweep',
       metadata: { email: targetUser.email, listingDeletedCount: userListings.length }
    })

    await User.findByIdAndDelete(targetUser._id)

    if (targetUser.email) {
       await sendAccountDeleted(targetUser.email)
    }

    await invalidateBrowseCache()

    return NextResponse.json({ success: true, message: 'Account and all associated assets irreversibly erased.' })
  } catch (error) {
    console.error('[/api/admin/users/[id] DELETE error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
