import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import Report from '@/lib/db/models/Report'
import { checkRateLimit } from '@/lib/middleware/rateLimit'
import { sanitizeText } from '@/lib/utils/validate'
import { z } from 'zod'

/**
 * POST: Report a Listing (Fix 12).
 * Strictly rate-limited (10/day per user UID).
 */
export const POST = withAuth(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { slug } = await context.params
    const userId = user.uid

    await connectDB()
    const dbUser = await User.findOne({ uid: userId })
    if (!dbUser) return NextResponse.json({ error: 'User missing from DB' }, { status: 404 })

    // ── RATE LIMIT (Fix 11/12): 10 reports per user per 24h ───────────────
    // Using the centralized rate limiting helper (Fix 1)
    const rl = await checkRateLimit(`report:${dbUser._id}`, 10, 86400)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Daily report limit reached (10 max). Try again tomorrow.' }, { status: 429 })
    }

    // ── VALIDATION & SANITISATION (Fix 2/3) ────────────────────────────────
    const body = await req.json()
    const reportSchema = z.object({
      reason: z.enum(['fake_listing', 'wrong_price', 'inappropriate', 'already_sold', 'spam', 'other']),
      description: z.string().max(500).transform(s => sanitizeText(s)).optional(),
    })
    
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.format() }, { status: 400 })
    }

    // ── DATA OPERATION ─────────────────────────────────────────────────────
    const listing = await Listing.findOne({ slug, isDeleted: false })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.seller.toString() === dbUser._id.toString()) {
       return NextResponse.json({ error: 'You cannot report your own listing!' }, { status: 400 })
    }

    // Check for duplicate pending reports for this specific user/listing pair
    const existingReport = await Report.findOne({
      listing: listing._id,
      reportedBy: dbUser._id,
      status: 'pending'
    })
    if (existingReport) {
      return NextResponse.json({ error: 'Already reported and under review.' }, { status: 400 })
    }

    await Report.create({
      listing: listing._id,
      reportedBy: dbUser._id, 
      reason: parsed.data.reason,
      description: parsed.data.description,
      status: 'pending'
    })

    return NextResponse.json({ success: true, message: 'Report submitted for review.' }, { status: 201 })

  } catch (error) {
    console.error('[/api/listings/[slug]/report POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
