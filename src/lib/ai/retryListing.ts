import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'
import { checkListingAI } from './checkListing'
import { invalidateBrowseCache } from '@/lib/redis/cache'

/**
 * Background retry for a single listing trapped in AI failsafe.
 * Fire-and-forget compatible.
 */
export async function retryListingAI(listingId: string) {
  try {
    await connectDB()

    const listing = await Listing.findById(listingId).populate('category', 'name')
    if (!listing || listing.isDeleted || listing.status !== 'pending' || !listing.aiUnavailable) {
      return
    }

    const categoryName = (listing.category as any)?.name || 'Miscellaneous'
    const result = await checkListingAI(
      listing.title, 
      listing.description, 
      listing.price, 
      categoryName
    )

    // If AI is still unavailable, do nothing and let it be retried later
    if (result.aiUnavailable) {
      return
    }

    // AI responded, update listing
    listing.aiUnavailable = false
    listing.aiFlagged = result.aiFlagged
    
    if (!result.aiFlagged) {
      listing.status = 'approved'
      await invalidateBrowseCache()
    }

    await listing.save()

  } catch (error) {
    console.error(`[retryListingAI] Failed for ${listingId}:`, error)
  }
}
