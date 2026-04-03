import { nanoid } from 'nanoid'
import dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'
import { connectDB } from '../src/lib/db/connect'
import { createIndexes } from '../src/lib/db/indexes'
import Category, { ICategory } from '../src/lib/db/models/Category'
import Listing from '../src/lib/db/models/Listing'
import User from '../src/lib/db/models/User'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const CATEGORIES = [
  { name: 'Electronics', icon: '💻', order: 1 },
  { name: 'Books & Notes', icon: '📚', order: 2 },
  { name: 'Clothing', icon: '👗', order: 3 },
  { name: 'Furniture', icon: '🪑', order: 4 },
  { name: 'Sports & Fitness', icon: '🏋️', order: 5 },
  { name: 'Miscellaneous', icon: '📦', order: 6 },
]

const CONDITIONS = ['new', 'like-new', 'good', 'used', 'damaged'] as const

const ADJECTIVES = [
  'Premium', 'Compact', 'Vintage', 'Modern', 'Sleek', 'Durable', 'Lightweight', 'High-speed',
  'Eco-friendly', 'Ergonomic', 'Professional', 'Minimalist', 'Robust', 'Portable', 'Sturdy',
  'Elegant', 'Powerful', 'Pocket-sized', 'Versatile', 'Reliable', 'Advanced', 'Stylish',
  'Handmade', 'Classic', 'Luxury', 'Essential', 'Ultimate', 'Smart', 'Wireless', 'Noise-canceling'
]

const ITEMS = [
  'Laptop', 'Earbuds', 'Calculator', 'Textbook', 'Jacket', 'Table', 'Speaker', 'Shoes',
  'Fridge', 'Tablet', 'Manual', 'Shirt', 'Bookshelf', 'Racket', 'Keyboard', 'Notes',
  'Hoodie', 'Lamp', 'Hub', 'Watch', 'Camera', 'Backpack', 'Monitor', 'Mouse',
  'Smartphone', 'Bicycle', 'Headphones', 'Guitar', 'Sunglasses', 'Charger'
]

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
  'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
]

async function seed() {
  console.log('[Seed-Large] Starting large-scale seeding...')
  console.log('[Seed-Large] Connecting to MongoDB...')
  await connectDB()
  await createIndexes()
  console.log('[Seed-Large] Database connected and indexes verified.')

  // 1. Get or Create Admin
  let adminUser = await User.findOne({ email: 'admin@unideal.local' })
  if (!adminUser) {
    adminUser = await User.create({
      uid: 'seed-admin-uid',
      email: 'admin@unideal.local',
      displayName: 'admin',
      role: 'admin',
      isActive: true,
      trustLevel: 'trusted',
    })
    console.log('[Seed-Large] Created admin user.')
  }

  // 2. Ensure Categories Exist
  const createdCategories: ICategory[] = []
  for (const cat of CATEGORIES) {
    const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    let existing = await Category.findOne({ slug })
    if (!existing) {
      existing = await Category.create({
        ...cat,
        slug,
        isActive: true,
        createdBy: adminUser._id,
      })
      console.log(`[Seed-Large] Created category: ${cat.name}`)
    }
    createdCategories.push(existing)
  }

  // 3. Generate 1000 Users
  console.log('[Seed-Large] Generating 1000 users...')
  const usersToInsert = []
  for (let i = 0; i < 1000; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const displayName = `${firstName} ${lastName}`
    const email = `user.${i + 1}.${nanoid(4).toLowerCase()}@unideal.local`
    
    usersToInsert.push({
      uid: `seed-user-uid-${i + 1}-${nanoid(6)}`,
      email,
      displayName,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: 'user',
      isActive: true,
      trustLevel: Math.random() > 0.8 ? 'trusted' : 'new',
      whatsappNumber: `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`,
      bio: `Student at LPU. Interested in ${createdCategories[Math.floor(Math.random() * createdCategories.length)].name}.`,
    })
  }

  const insertedUsers = await User.insertMany(usersToInsert)
  console.log(`[Seed-Large] Successfully inserted ${insertedUsers.length} users.`)

  // 4. Generate 1000 Listings
  console.log('[Seed-Large] Generating 1000 listings...')
  const listingsToInsert = []
  
  for (let i = 0; i < 1000; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]
    const title = `${adj} ${item}`
    const slug = `${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${nanoid(6)}`
    
    const seller = insertedUsers[Math.floor(Math.random() * insertedUsers.length)]
    const category = createdCategories[Math.floor(Math.random() * createdCategories.length)]
    const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]
    const price = Math.floor(Math.random() * 5000) + 150
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    listingsToInsert.push({
      title,
      description: `Selling my ${title}. It's in ${condition} condition. Very useful for students. Price is ${i % 4 === 0 ? 'negotiable' : 'fixed'}. Direct message me for more details.`,
      price,
      negotiable: i % 4 === 0,
      category: category._id,
      condition,
      images: [`https://picsum.photos/seed/${slug}/800/600`],
      seller: seller._id,
      sellerBanned: false,
      status: 'approved',
      isDeleted: false,
      aiFlagged: false,
      aiUnavailable: false,
      aiVerification: { checked: true, flagged: false, flags: [], confidence: 1, reason: 'Seed data' },
      slug,
      views: Math.floor(Math.random() * 500),
      bumpCount: 0,
      expiresAt,
      isExpired: false,
    })
  }

  const insertedListings = await Listing.insertMany(listingsToInsert)
  console.log(`[Seed-Large] Successfully inserted ${insertedListings.length} listings.`)

  console.log('\n[Seed-Large] Seeding complete! 🎉')
  console.log(`Summary: +1000 Users, +1000 Listings added to the database.`)
  
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('[Seed-Large] Error during seeding:', err)
  process.exit(1)
})
