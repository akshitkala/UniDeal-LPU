import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User' // Need to populate seller
import redis from '@/lib/redis/client'
import { invalidateBrowseCache } from '@/lib/redis/cache'
import { sendListingExpired } from '@/lib/email/resend'

// Vercel Cron Dispatcher: 0 2 * * * (Daily at 2:00 AM)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized CRON Dispatch' }, { status: 401 })
    }

    await connectDB()

    // Locate listings where expiration date has passed but still marked active
    const now = new Date()
    const expiredPayloads = await Listing.find({
      expiresAt: { $lt: now },
      isExpired: false,
      isDeleted: false
    }).populate('seller', 'email activeListings')

    if (expiredPayloads.length === 0) {
      return NextResponse.json({ success: true, message: 'No expirations found in this sweep.' })
    }

    // Process all expiries
    const updates = []
    const emailPromises = []

    for (const listing of expiredPayloads) {
      // Mark listing 
      listing.isExpired = true
      updates.push(listing.save())

      // Decrement User's active listings count gracefully
      if (listing.seller) {
         updates.push(User.findByIdAndUpdate(listing.seller._id, { $inc: { activeListings: -1 } }))
         
         // Dispatch Email
         if ((listing.seller as any).email) {
            emailPromises.push(sendListingExpired((listing.seller as any).email, listing.title))
         }
      }
    }

    await Promise.allSettled(updates)
    await Promise.allSettled(emailPromises)

    // Flush cache globally out of safe redundancy
    await invalidateBrowseCache()

    return NextResponse.json({ 
       success: true, 
       processed: expiredPayloads.length, 
       message: 'Nightly Expiration Sweeper Completed' 
    })
  } catch (error) {
    console.error('[/api/cron/expiry GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
