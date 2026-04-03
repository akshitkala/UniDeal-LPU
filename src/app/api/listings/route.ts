import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import Category from '@/lib/db/models/Category'
import User from '@/lib/db/models/User'
import SystemConfig from '@/lib/db/models/SystemConfig'
import redis from '@/lib/redis/client'
import { CACHE_KEYS, invalidateBrowseCache } from '@/lib/redis/cache'
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

    const { category, condition, minPrice, maxPrice, sort, q, cursor } = parsed.data
    const DEFAULT_LIMIT = 12
    const MAX_LIMIT = 48
    const limit = Math.min(
      Number(searchParams.get('limit')) || DEFAULT_LIMIT, 
      MAX_LIMIT
    )

    // Build cache key from all filter params (Fix 4)
    const cacheKey = `feed:browse:${JSON.stringify({
      category, condition, minPrice, maxPrice, sort, cursor, q, limit
    })}`

    // Check Redis Cache (Fix 4)
    if (!q) { // only cache non-search results
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          return NextResponse.json(cached, {
            headers: { 
              'X-Cache': 'HIT',
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
          })
        }
      } catch (e) {
        console.warn('[Redis] Cache check failed:', e)
      }
    }

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
        return NextResponse.json({ listings: [], nextCursor: null, total: 0 })
      }
    }
    if (condition) filter.condition = condition
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      }
    }

    // ── CURSOR: use _id for stable pagination (Fix 3) ───────────────────
    if (cursor) {
      try {
        filter._id = { $lt: new mongoose.Types.ObjectId(cursor) }
      } catch (e) {
        // Invalid cursor
      }
    }

    const CARD_PROJECTION = {
      title: 1,
      price: 1,
      negotiable: 1,
      'images': { $slice: 1 }, 
      condition: 1,
      category: 1,
      slug: 1,
      bumpedAt: 1,
      createdAt: 1,
      seller: 1,
      sellerBanned: 1,
      status: 1,
      _id: 1,
    }

    // ── DEV ONLY: Query Plan Explanation (Fix 1) ───────────────────────
    if (process.env.NODE_ENV === 'development') {
      const explanation = await (Listing.find(filter) as any)
        .explain('executionStats')
      console.log('[Query Plan]', 
        explanation.executionStats.executionStages.stage,
        'docsExamined:', 
        explanation.executionStats.totalDocsExamined,
        'docsReturned:', 
        explanation.executionStats.totalDocsReturned
      )
    }

    // 3. Execution (Fix 2 & 3)
    let listingsQuery = Listing.find(filter, CARD_PROJECTION)
      .limit(limit + 1)
      .populate('category', 'name slug')
      .populate('seller', 'displayName email')
      .lean()

    if (q) {
      filter.$text = { $search: q }
      listingsQuery = listingsQuery.select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
    } else {
      listingsQuery = listingsQuery.sort({ bumpedAt: -1, createdAt: -1 })
    }

    const [listings, total] = await Promise.all([
      listingsQuery,
      Listing.countDocuments(filter)
    ])

    const hasMore = listings.length > limit
    const data = hasMore ? listings.slice(0, limit) : listings
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null

    const result = { listings: data, nextCursor, total }

    // Write to Redis (Fix 4)
    if (!q) {
      redis.set(cacheKey, result, { ex: 60 }).catch(() => {})
    }

    // 4. Response with HTTP Headers (Fix 5)
    const headers: Record<string, string> = { 'X-Cache': 'MISS' }
    if (!q) {
      headers['Cache-Control'] = 'public, s-maxage=30, stale-while-revalidate=60'
    }

    return NextResponse.json(result, { headers })
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
    await invalidateBrowseCache()

    // 6. Fire-and-forget AI Check (Fix 7) & Policy Enforcement
    const checkAI = async () => {
      try {
        const [aiCheck, config] = await Promise.all([
          checkListingAI(parsedData.data.title, parsedData.data.description, parsedData.data.price, validCategory.name),
          SystemConfig.findOne({})
        ])

        const mode = config?.approvalMode || 'ai_flagging'
        
        let shouldApprove = false
        if (mode === 'automatic') {
          shouldApprove = true
        } else if (mode === 'ai_flagging' && !aiCheck.aiFlagged && !aiCheck.aiUnavailable) {
          shouldApprove = true
        }

        const updateData: any = {
          aiFlagged: aiCheck.aiFlagged,
          aiUnavailable: aiCheck.aiUnavailable,
          aiVerification: {
             reason: aiCheck.reason,
             confidence: aiCheck.confidence
          }
        }

        if (shouldApprove) {
          updateData.status = 'approved'
          await invalidateBrowseCache()
        }

        await Listing.findByIdAndUpdate(newListing._id, updateData)
      } catch (err) {
        console.error('[AI Post-Save Error]', err)
        await Listing.findByIdAndUpdate(newListing._id, {
          aiFlagged: true,
          aiUnavailable: true
        })
      }
    }

    checkAI()

    return NextResponse.json({ slug: finalSlug }, { status: 201 })
  } catch (error) {
    console.error('[/api/listings POST error]', error)
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 })
  }
})
