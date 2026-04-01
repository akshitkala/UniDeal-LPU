import { nanoid } from 'nanoid'

/**
 * Seed script — run with: npx tsx scripts/seed.ts
 * Creates 6 categories + 20 sample listings in MongoDB Atlas.
 * Requires MONGODB_URI to be set in environment.
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env.local explicitly since dotenv defaults to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose from 'mongoose'
import { connectDB } from '../src/lib/db/connect'
import { createIndexes } from '../src/lib/db/indexes'
import Category, { ICategory } from '../src/lib/db/models/Category'
import Listing from '../src/lib/db/models/Listing'
import User from '../src/lib/db/models/User'

const CATEGORIES = [
  { name: 'Electronics', icon: '💻', order: 1 },
  { name: 'Books & Notes', icon: '📚', order: 2 },
  { name: 'Clothing', icon: '👗', order: 3 },
  { name: 'Furniture', icon: '🪑', order: 4 },
  { name: 'Sports & Fitness', icon: '🏋️', order: 5 },
  { name: 'Miscellaneous', icon: '📦', order: 6 },
]

const CONDITIONS = ['new', 'like-new', 'good', 'used', 'damaged'] as const

const SAMPLE_TITLES = [
  'Dell Inspiron 15 Laptop',
  'Noise Cancelling Earbuds',
  'Scientific Calculator Casio FX-991',
  'Engineering Mathematics Vol 1 & 2',
  'Blue Denim Jacket (M)',
  'Study Table with Drawers',
  'JBL Portable Speaker',
  'Data Structures Textbook',
  'Running Shoes Nike (Size 9)',
  'Mini Fridge 30L',
  'Graphics Tablet Wacom',
  'Chemistry Lab Manual',
  'Formal Shirt Pack (3)',
  'Wooden Bookshelf',
  'Badminton Racket Set',
  'Mechanical Keyboard',
  'Physics Revision Notes (Handwritten)',
  'Winter Hoodie (L)',
  'Desk Lamp LED',
  'USB-C Hub 7-in-1',
]

async function seed() {
  console.log('[Seed] Connecting to MongoDB...')
  await connectDB()
  await createIndexes()
  console.log('[Seed] Connected. Creating indexes...')

  // Create a placeholder admin user for seeding
  let adminUser = await User.findOne({ email: 'admin@unideal.local' })
  if (!adminUser) {
    adminUser = await User.create({
      uid: 'seed-admin-uid',
      email: 'admin@unideal.local',
      displayName: 'admin',
      photoURL: '',
      role: 'admin',
      isActive: true,
      trustLevel: 'trusted',
    })
    console.log('[Seed] Created seed admin user')
  }

  // Create categories
  const createdCategories: ICategory[] = []
  for (const cat of CATEGORIES) {
    const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const existing = await Category.findOne({ slug })
    if (!existing) {
      const created = await Category.create({
        ...cat,
        slug,
        isActive: true,
        createdBy: adminUser._id,
      })
      createdCategories.push(created)
      console.log(`[Seed] Created category: ${cat.name}`)
    } else {
      createdCategories.push(existing)
      console.log(`[Seed] Category exists: ${cat.name}`)
    }
  }

  // Create seed seller user
  let sellerUser = await User.findOne({ email: 'seller@unideal.local' })
  if (!sellerUser) {
    sellerUser = await User.create({
      uid: 'seed-seller-uid',
      email: 'seller@unideal.local',
      displayName: 'campus.seller',
      photoURL: '',
      role: 'user',
      isActive: true,
      trustLevel: 'trusted',
    })
  }

  // Step 0: Remove existing listings with no images
  const deleted = await Listing.deleteMany({ images: { $size: 0 } })
  console.log(`[Seed] Deleted ${deleted.deletedCount} listings with no images.`)

  // Create 100 listings (random images from Picsum, all approved)
  const TOTAL_TO_SEED = 100
  let created = 0

  for (let i = 0; i < TOTAL_TO_SEED; i++) {
    const titleBase = SAMPLE_TITLES[i % SAMPLE_TITLES.length]
    const title = i < SAMPLE_TITLES.length ? titleBase : `${titleBase} (Batch ${Math.floor(i / SAMPLE_TITLES.length)})`
    const slug = `${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${nanoid(6)}`
    
    // Picsum random image URL (800x600 with seed for uniqueness)
    const imageUrl = `https://picsum.photos/seed/${slug}/800/600`
    
    const category = createdCategories[i % createdCategories.length]
    const condition = CONDITIONS[i % CONDITIONS.length]
    const price = Math.floor(Math.random() * 5000) + 200
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    await Listing.create({
      title,
      description: `Premium quality ${title} in ${condition} condition. Available for quick pickup on campus. Price is ${i % 3 === 0 ? 'negotiable' : 'fixed'}. Contact me for more details.`,
      price,
      negotiable: i % 3 === 0,
      category: category._id,
      condition,
      images: [imageUrl], // Random placeholder image
      seller: sellerUser._id,
      sellerBanned: false,
      status: 'approved',
      isDeleted: false,
      aiFlagged: false,
      aiUnavailable: false,
      aiVerification: { checked: true, flagged: false, flags: [], confidence: 1, reason: 'Seed data' },
      slug,
      views: Math.floor(Math.random() * 200),
      bumpCount: 0,
      expiresAt,
      isExpired: false,
    })
    created++
    if (created % 10 === 0) console.log(`[Seed] Created ${created}/${TOTAL_TO_SEED} listings...`)
  }

  console.log(`\n[Seed] Done! ${createdCategories.length} categories, ${created} listings created.`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('[Seed] Error:', err)
  process.exit(1)
})
