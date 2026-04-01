import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'

/**
 * GET: Check Category Collision Scope (Fix 9).
 * Returns { canDelete: boolean, affectedCount: number } for UI Resolution Modal.
 */
export const GET = withAdmin(async (req, user, context) => {
  try {
    if (!context) return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    const { id } = await context.params

    await connectDB()

    // ── FIXED: Identify affected listings scope (Fix 9) ──────────────────────
    const affectedCount = await Listing.countDocuments({ 
      category: id,
      isDeleted: false, // Only count items that aren't already soft-deleted
    })

    return NextResponse.json({ 
      canDelete: affectedCount === 0, 
      affectedCount 
    }, { status: 200 })
    
  } catch (error) {
    console.error('[/api/admin/categories/[id]/check GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
