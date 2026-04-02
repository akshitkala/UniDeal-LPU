import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/db/connect'
import Listing from '@/lib/db/models/Listing'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://unideal.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB()

  // Fetch all live, approved listings
  const listings = await Listing.find({
    status: 'approved',
    isDeleted: false,
    sellerBanned: false,
    aiFlagged: false,
    isExpired: false,
  }).select('slug updatedAt').lean()

  const listingEntries: MetadataRoute.Sitemap = listings.map((l: any) => ({
    url: `${BASE_URL}/listing/${l.slug}`,
    lastModified: l.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/safety`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  return [...staticPages, ...listingEntries]
}
