import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import Category from '@/lib/db/models/Category'
import Listing from '@/lib/db/models/Listing'

export const GET = withAdmin(async () => {
  try {
    await connectDB()
    const categories = await Category.find({}).sort({ name: 1 }).lean()
    
    // Compute current usage distribution across categories
    const payloads = await Promise.all(categories.map(async (c) => {
       const listingCount = await Listing.countDocuments({ category: c._id })
       return { ...c, listingCount }
    }))

    return NextResponse.json(payloads, { status: 200 })
  } catch (error) {
    console.error('[/api/admin/categories GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

export const POST = withAdmin(async (req) => {
  try {
    const { name, slug, icon } = await req.json()
    if (!name || !slug || !icon) return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })

    await connectDB()
    const existing = await Category.findOne({ slug })
    if (existing) return NextResponse.json({ error: 'Category slug already mapped' }, { status: 400 })

    const category = await Category.create({ name, slug, icon })
    
    // (Optional) flush directory caching

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('[/api/admin/categories POST error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
