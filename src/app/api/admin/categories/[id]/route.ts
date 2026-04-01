import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Category from '@/lib/db/models/Category'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import Report from '@/lib/db/models/Report'
import { deleteImages } from '@/lib/utils/cloudinary'
import redis from '@/lib/redis/client'
import { logAction } from '@/lib/utils/logAction'
import { sendListingDeletedByAdminEmail } from '@/lib/email/resend'

/**
 * DELETE: Manipulate Category Tree (Fix 10).
 * Supports 'reassign' or 'cascade' (destructive flush with seller notifications).
 */
export const DELETE = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    
    const mode = searchParams.get('mode')
    const reassignToId = searchParams.get('reassignToId')

    await connectDB()
    const adminUser = await User.findOne({ uid: user.uid })
    if (!adminUser) return NextResponse.json({ error: 'Admin missing from DB' }, { status: 404 })

    const category = await Category.findById(id)
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    // Find all affected listings
    const listings = await Listing.find({ category: id, isDeleted: false })
      .populate('seller', 'email displayName')

    if (listings.length > 0) {
      if (mode === 'reassign') {
        if (!reassignToId) return NextResponse.json({ error: 'Reassignment target required' }, { status: 400 })
        const targetCategory = await Category.findById(reassignToId)
        if (!targetCategory) return NextResponse.json({ error: 'Target category missing' }, { status: 404 })
        
        await Listing.updateMany({ category: id }, { $set: { category: reassignToId } })

        await logAction('CATEGORY_REASSIGNED', {
          actor: adminUser._id,
          metadata: { oldCategory: category.name, newCategory: targetCategory.name, count: listings.length }
        })
      } 
      else if (mode === 'cascade') {
        // ── FIXED: Fix 10 requirements ───────────────────────────────────────
        
        // 1. Gather all images for bulk purge
        const allImages: string[] = []
        listings.forEach(l => {
          if (l.images?.length) allImages.push(...l.images)
        })

        // 2. Notify Sellers by Email (Fix 10)
        const emailPromises = listings.map(l => {
          const seller = l.seller as any
          return sendListingDeletedByAdminEmail({
            to: seller.email,
            name: seller.displayName,
            listing: l.title,
            reason: `The category '${category.name}' was decommissioned by an administrator.`
          }).catch(err => console.error('[CASCADE EMAIL FAULT]', err))
        })
        await Promise.allSettled(emailPromises)

        // 3. Purge Cloudinary + Database (Fix 10)
        if (allImages.length > 0) await deleteImages(allImages)
        
        const listingIds = listings.map(l => l._id)
        await Listing.deleteMany({ _id: { $in: listingIds } })
        await Report.deleteMany({ listing: { $in: listingIds } })

        await logAction('CATEGORY_DELETED', {
          actor: adminUser._id,
          metadata: { mode: 'cascade', category: category.name, deletedCount: listings.length }
        })
      } else {
        return NextResponse.json({ 
          error: 'Collision Conflict: Must specify mode=cascade or mode=reassign',
          affectedCount: listings.length 
        }, { status: 409 })
      }
    } else {
      // Empty category deletion
      await logAction('CATEGORY_DELETED', {
        actor: adminUser._id,
        metadata: { category: category.name, mode: 'direct' }
      })
    }

    // Finally delete the category document
    await Category.findByIdAndDelete(id)

    // Flush Browse Cache
    await redis.del('listings:browse:1:12')
    
    return NextResponse.json({ success: true, message: 'Category tree manipulated.' })

  } catch (error) {
    console.error('[/api/admin/categories/[id] DELETE error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
