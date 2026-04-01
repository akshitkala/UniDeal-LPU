import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Category from '@/lib/db/models/Category'

/**
 * GET: Retrieve all active categories for the public marketplace.
 * Used by /post and /browse pages.
 */
export async function GET() {
  try {
    await connectDB()
    
    // Fetch only active categories, sorted by name
    const categories = await Category.find({ isActive: true })
      .select('name slug icon description')
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(categories)
  } catch (error) {
    console.error('[/api/categories GET error]', error)
    return NextResponse.json({ error: 'Failed to synchronize categories' }, { status: 500 })
  }
}
