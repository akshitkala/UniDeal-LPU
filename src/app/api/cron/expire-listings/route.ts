import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import User from '@/lib/db/models/User'
import { invalidateBrowseCache } from '@/lib/redis/cache'
import { sendListingExpired } from '@/lib/email/resend'

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron: 0 2 * * * (Daily at 2:00 AM)
 * Standardized Expiration Sweeper
 */
export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB()

    const now = new Date()
    const expiredPayloads = await Listing.find({
      expiresAt: { $lt: now },
      isExpired: false,
      isDeleted: false
    }).populate('seller', 'email activeListings')

    if (expiredPayloads.length === 0) {
      return Response.json({ success: true, message: 'No expirations found in this sweep.' })
    }

    const updates = []
    const emailPromises = []

    for (const listing of expiredPayloads) {
      listing.isExpired = true
      updates.push(listing.save())

      if (listing.seller) {
         updates.push(User.findByIdAndUpdate(listing.seller._id, { $inc: { activeListings: -1 } }))
         
         if ((listing.seller as any).email) {
            emailPromises.push(sendListingExpired((listing.seller as any).email, listing.title))
         }
      }
    }

    await Promise.allSettled(updates)
    await Promise.allSettled(emailPromises)

    await invalidateBrowseCache()

    return Response.json({ 
       success: true, 
       processed: expiredPayloads.length, 
       message: 'Nightly Expiration Sweeper Completed' 
    })
  } catch (error) {
    console.error('[/api/cron/expire-listings GET error]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
