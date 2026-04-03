import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Category from '@/lib/db/models/Category'
import redis from '@/lib/redis/client'
import { CACHE_KEYS } from '@/lib/redis/cache'

/**
 * GET: Retrieve all active categories for the public marketplace.
 * Used by /post and /browse pages.
 */
export async function GET() {
  try {
    const CATEGORIES_CACHE_KEY = 'categories:active'
    const CATEGORIES_TTL = 300 // 5 minutes

    const cached = await redis.get(CATEGORIES_CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
    }

    await connectDB()
    
    // Fetch only active categories, sorted by order (Fix 10)
    const categories = await Category.find({ isActive: true })
      .select('name slug icon order')
      .sort({ order: 1 })
      .lean()

    redis.set(CATEGORIES_CACHE_KEY, categories, { ex: CATEGORIES_TTL })
      .catch(() => {})

    return NextResponse.json(categories, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('[/api/categories GET error]', error)
    return NextResponse.json({ error: 'Failed to synchronize categories' }, { status: 500 })
  }
}
