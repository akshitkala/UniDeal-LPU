import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import Category from '@/lib/db/models/Category'
import User from '@/lib/db/models/User'
import redis from '@/lib/redis/client'
import { CACHE_KEYS, invalidateFeed } from '@/lib/redis/cache'
import { withAuth } from '@/lib/middleware/auth'
import { uploadImageBuffer } from '@/lib/utils/cloudinary'
import { browseSchema, listingSchema } from '@/lib/utils/validate'
import { validateMimeType } from '@/lib/utils/validateMime'
import { checkListingAI } from '@/lib/ai/checkListing'
import { nanoid } from 'nanoid'

/**
 * GET: Browse Listings with CURSOR-BASED PAGINATION (Fix 6)
 * Uses 4-condition visibility filter and strictly validated params (Fix 4).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    // 1. Strict Validation via Zod (Fix 4)
    const parsed = browseSchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', issues: parsed.error.format() }, { status: 400 })
    }

    const { category, condition, minPrice, maxPrice, sort, limit, q, cursor } = parsed.data

    await connectDB()

    // 2. Base Filter: MANDATORY 4 Conditions + Expiry
    const filter: any = {
      status: 'approved',
      isDeleted: false,
      sellerBanned: false,
      aiFlagged: false,
      isExpired: false,
    }

    if (category) {
      const catDoc = await Category.findOne({ slug: category, isActive: true })
      if (catDoc) {
        filter.category = catDoc._id
      } else {
        // Return 0 results if slug is invalid
        return NextResponse.json({ listings: [], nextCursor: null })
      }
    }
    if (condition) filter.condition = condition
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      }
    }
    if (q) filter.$text = { $search: q }

    // ── CURSOR: use bumpedAt + _id for stable O(log n) sort ─────────────────
    if (cursor) {
      try {
        const { bumpedAt, _id } = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
        filter.$or = [
          { bumpedAt: { $lt: new Date(bumpedAt) } },
          { bumpedAt: new Date(bumpedAt), _id: { $lt: _id } },
        ]
      } catch (e) {
        return NextResponse.json({ error: 'Invalid cursor format' }, { status: 400 })
      }
    }

    // 3. Execution
    const listings = await Listing.find(filter)
      .select('title price images condition category slug bumpedAt createdAt seller negotiable')
      .sort({ bumpedAt: -1, _id: -1 })
      .limit(limit + 1) // check for next page
      .populate('category', 'name slug icon')
      .populate('seller', 'displayName photoURL isLpuVerified')
      .lean()

    const hasNext = listings.length > limit
    const data = hasNext ? listings.slice(0, -1) : listings
    
    // Construct Next Cursor
    let nextCursor = null
    if (hasNext && data.length > 0) {
      const lastItem = data[data.length - 1]
      nextCursor = Buffer.from(JSON.stringify({
        bumpedAt: lastItem.bumpedAt,
        _id: lastItem._id
      })).toString('base64')
    }

    return NextResponse.json({ listings: data, nextCursor })
  } catch (error) {
    console.error('[/api/listings GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST: Create Listing with MAGIC BYTE PROTECTION (Fix 14) and Strict Validation (Fix 3).
 */
export const POST = withAuth(async (req, user) => {
  try {
    const userId = user.uid

    // 1. Rate Limiting (5 listings/user/day)
    const rateLimitKey = `ratelimit:listings:${userId}`
    const currentCount = await redis.incr(rateLimitKey)
    if (currentCount === 1) await redis.expire(rateLimitKey, 86400)
    
    if (currentCount > 5) {
      return NextResponse.json({ error: 'Daily listing limit reached (5 max)' }, { status: 429 })
    }

    await connectDB()
    const dbUser = await User.findOne({ uid: userId })
    if (!dbUser || dbUser.isActive === false) {
      return NextResponse.json({ error: 'User not found or banned' }, { status: 403 })
    }

    // 2. Data Parsing & Sanitization (via shared schema)
    const formData = await req.formData()
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: formData.get('price'),
      negotiable: formData.get('negotiable') === 'true',
      category: formData.get('category'),
      condition: formData.get('condition'),
      whatsappNumber: formData.get('whatsappNumber'),
    }

    const parsedData = listingSchema.safeParse(rawData)
    if (!parsedData.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsedData.error.format() }, { status: 400 })
    }

    const validCategory = await Category.findById(parsedData.data.category)
    if (!validCategory || !validCategory.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive category' }, { status: 400 })
    }

    // 3. IMAGE SECURITY: Magic Bytes & Cloudinary (Fix 13/14)
    const imageFiles = formData.getAll('images') as File[]
    if (imageFiles.length > 2) return NextResponse.json({ error: 'Max 2 images limit enforced' }, { status: 400 })

    const uploadedUrls: string[] = []
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer())
      
      // MAGIC BYTE VERIFICATION (Fix 14)
      const mime = validateMimeType(buffer)
      if (!mime) {
        return NextResponse.json({ error: 'Tampered or unsupported file format. JPEG/PNG/WebP only.' }, { status: 400 })
      }

      try {
        const url = await uploadImageBuffer(buffer)
        uploadedUrls.push(url)
      } catch (err) {
        console.error('Upload Error:', err)
        return NextResponse.json({ error: 'Storage failure during asset ingestion' }, { status: 500 })
      }
    }

    // 4. WhatsApp Sync: Save to profile if missing
    if (parsedData.data.whatsappNumber && !dbUser.whatsappNumber) {
        dbUser.whatsappNumber = parsedData.data.whatsappNumber
        await dbUser.save()
    }

    // 5. DB Write
    const baseSlug = parsedData.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    const finalSlug = `${baseSlug}-${nanoid(6)}`

    const now = new Date()
    const newListing = new Listing({
      ...parsedData.data,
      images: uploadedUrls,
      seller: dbUser._id,
      slug: finalSlug,
      status: 'pending',
      bumpedAt: now,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    })

    // Update User Listing Counts
    await User.findByIdAndUpdate(dbUser._id, { $inc: { totalListings: 1, activeListings: 1 } })

    // Save first — never blocks the response
    await newListing.save()
    await invalidateFeed()

    // 6. Fire-and-forget AI Check (Fix 7)
    checkListingAI(
      parsedData.data.title,
      parsedData.data.description,
      parsedData.data.price,
      validCategory.name
    ).then(async (aiCheck) => {
      // Update flags & auto-approve if clean
      const updateData: any = {
        aiFlagged: aiCheck.aiFlagged,
        aiUnavailable: aiCheck.aiUnavailable,
      }
      if (!aiCheck.aiFlagged && !aiCheck.aiUnavailable) {
        updateData.status = 'approved'
        // Flush cache for this category
        await redis.del(`feed:browse:1:12:${validCategory._id || 'all'}:newest:none`)
      }
      await Listing.findByIdAndUpdate(newListing._id, updateData)
    }).catch(async (err) => {
      console.error('[AI Post-Save Error]', err)
      await Listing.findByIdAndUpdate(newListing._id, {
        aiFlagged: true,
        aiUnavailable: true
      })
    })

    return NextResponse.json({ slug: finalSlug }, { status: 201 })
  } catch (error) {
    console.error('[/api/listings POST error]', error)
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 })
  }
})
