import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import Category from '@/lib/db/models/Category'
import redis from '@/lib/redis/client'
import { checkListingAI } from '@/lib/ai/checkListing'

// Vercel Cron Dispatcher: */30 * * * * (Every 30 mins)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    // Wait, the documentation says "All cron routes validate CRON_SECRET header".
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized CRON Dispatch' }, { status: 401 })
    }

    await connectDB()

    // Find listings trapped in AI failsafe block
    const failedPayloads = await Listing.find({
      aiUnavailable: true,
      status: 'pending',
      isDeleted: false
    }).populate('category', 'name')

    if (failedPayloads.length === 0) {
      return NextResponse.json({ success: true, message: 'All queues green. No retries necessary.' })
    }

    let resolvedCount = 0
    let clearedCount = 0

    const updatePromises = []

    for (const listing of failedPayloads) {
      try {
         const categoryName = listing.category && (listing.category as any).name ? (listing.category as any).name : 'Mixed'
         const result = await checkListingAI(listing.title, listing.description, listing.price, categoryName)

         if (!result.aiUnavailable) {
           resolvedCount++
           
           listing.aiUnavailable = false
           if (!result.aiFlagged) {
             // System has dynamically cleared it
             listing.aiFlagged = false
             listing.status = 'approved'
             clearedCount++
           } else {
             // AI flags it, remains pending for admin review
             listing.aiFlagged = true
           }

           updatePromises.push(listing.save())
         }
      } catch (e) {
         console.warn(`[AI-Retry] Listing ${listing.slug} failed processing again. Keeping trapped.`)
      }
    }

    await Promise.allSettled(updatePromises)

    if (clearedCount > 0) {
      await redis.del('listings:browse:1:12')
    }

    return NextResponse.json({ 
       success: true, 
       message: `AI Queue Resurrected: Examined ${failedPayloads.length}, Resolved APIs applied to ${resolvedCount}, Auto-published ${clearedCount} vectors into public framework.` 
    })
  } catch (error) {
    console.error('[/api/cron/ai-retry GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
