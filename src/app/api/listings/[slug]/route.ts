import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import Category from '@/lib/db/models/Category'
import redis from '@/lib/redis/client'
import { CACHE_KEYS, invalidateListing, invalidateBrowseCache } from '@/lib/redis/cache'
import { withAuth, getUserFromRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { checkListingAI } from '@/lib/ai/checkListing'

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  price: z.number().min(0).max(999999).optional(),
  negotiable: z.boolean().optional(),
  condition: z.enum(['new', 'like-new', 'good', 'used', 'damaged']).optional(),
  category: z.string().optional(),
  images: z.array(z.string()).min(1).max(2).optional()
})

/**
 * GET /api/listings/[slug]
 * Retrieves a single listing with caching and visibility checks.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    await connectDB()

    // Fetch listing with seller populated to check ownership
    const listing = await Listing.findOne({ slug })
      .populate('category', 'name slug icon')
      .populate('seller', 'uid displayName photoURL trustLevel createdAt +whatsappNumber')
      .lean() as any

    if (!listing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Visibility Check
    const isPublic = ['approved', 'sold'].includes(listing.status) 
                       && !listing.isDeleted 
                       && !listing.sellerBanned 
                       && !listing.aiFlagged
                       && !listing.isExpired

    const currentUser = await getUserFromRequest(req)
    const isOwner = currentUser?.uid === listing.seller.uid
    const isAdmin = currentUser?.role === 'admin'

    if (!isPublic && !isOwner && !isAdmin) {
      // Intentional 200 with error: 'not_available' for neutral page handling
      return NextResponse.json({ error: 'not_available' }, { status: 200 })
    }

    // Track View (Non-blocking)
    Listing.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec()

    return NextResponse.json({ listing })
  } catch (error) {
    console.error(`[Listing Detail GET error]`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { uploadImageBuffer } from '@/lib/utils/cloudinary'
import { validateMimeType } from '@/lib/utils/validateMime'

/**
 * PATCH /api/listings/[slug]
 * Updates a listing (Ownership required).
 * Supports JSON or FormData (for image updates).
 */
export const PATCH = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    await connectDB()

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // 1. Ownership & Restriction Checks
    if (listing.seller.toString() !== user.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (listing.status === 'sold') {
      return NextResponse.json({ error: 'Cannot edit a sold listing' }, { status: 400 })
    }

    if (listing.sellerBanned) {
      return NextResponse.json({ error: 'Account restricted' }, { status: 403 })
    }

    const contentType = req.headers.get('content-type') || ''
    let updateData: any = {}
    let uploadedUrls: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      
      // Extract basic fields
      const fields = ['title', 'description', 'price', 'negotiable', 'category', 'condition']
      fields.forEach(f => {
        const val = formData.get(f)
        if (val !== null) {
          if (f === 'price') updateData[f] = Number(val)
          else if (f === 'negotiable') updateData[f] = val === 'true'
          else updateData[f] = val
        }
      })

      // Handle Existing Images
      const existing = formData.getAll('existingImages') as string[]
      uploadedUrls = [...existing]

      // Handle New Images
      const newImages = formData.getAll('images') as File[]
      if (uploadedUrls.length + newImages.length > 2) {
        return NextResponse.json({ error: 'Max 2 images allowed' }, { status: 400 })
      }

      for (const file of newImages) {
        if (!file.size) continue
        const buffer = Buffer.from(await file.arrayBuffer())
        const mime = validateMimeType(buffer)
        if (!mime) return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
        
        const url = await uploadImageBuffer(buffer)
        uploadedUrls.push(url)
      }
      
      if (uploadedUrls.length > 0) updateData.images = uploadedUrls

    } else {
      updateData = await req.json()
    }

    // 2. Validation
    const validated = updateSchema.safeParse(updateData)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 })
    }

    // 3. Apply Updates
    Object.entries(validated.data).forEach(([key, value]) => {
      if (value !== undefined) (listing as any)[key] = value
    })

    // 4. Force Re-Review
    listing.status = 'pending'
    listing.aiFlagged = false
    listing.aiUnavailable = false
    listing.aiVerification = { 
      checked: false, 
      flagged: false, 
      flags: [], 
      confidence: 0, 
      reason: '',
      checkedAt: new Date()
    }

    await listing.save()

    // 5. Cache Invalidation
    await invalidateListing(slug)
    await invalidateBrowseCache()

    // 6. Background AI Re-check
    let categoryName = ''
    try {
        const catId = validated.data.category || listing.category
        const cat = await Category.findById(catId)
        categoryName = cat?.name || 'General'
    } catch (e) {
        categoryName = 'General'
    }

    checkListingAI(listing.title, listing.description, listing.price, categoryName).then(async (result) => {
        if (result) {
            await Listing.findByIdAndUpdate(listing._id, {
                aiFlagged: result.aiFlagged,
                aiVerification: {
                    ...result,
                    checked: true,
                    checkedAt: new Date()
                },
                // If AI is confident it's fine, we can auto-approve (Optional based on policy)
                // For now, keep it pending for safety or implement auto-approval logic like in POST
            })
        }
    }).catch((err: any) => {
      console.error('[AI Re-check Error]', err)
      Listing.findByIdAndUpdate(listing._id, {
        aiFlagged: true,
        aiUnavailable: true
      }).exec()
    })

    return NextResponse.json({ success: true, slug: listing.slug })
  } catch (error) {
    console.error('[Listing Detail PATCH error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

/**
 * DELETE /api/listings/[slug]
 * Soft-deletes a listing.
 */
export const DELETE = withAuth(async (req, user, context) => {
  try {
    const { slug } = await context!.params
    await connectDB()

    const listing = await Listing.findOne({ slug })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.seller.toString() !== user.dbId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    listing.isDeleted = true
    await listing.save()
    
    await invalidateListing(slug)
    await User.findByIdAndUpdate(user.dbId, { $inc: { activeListings: -1 } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Listing Detail DELETE error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
