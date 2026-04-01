import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'
import Listing from '@/lib/db/models/Listing'
import Report from '@/lib/db/models/Report'
import ContactMessage from '@/lib/db/models/ContactMessage'
import AdminActivity from '@/lib/db/models/AdminActivity'
import { deleteImages } from '@/lib/utils/cloudinary'
import { adminAuth } from '@/lib/firebase/admin'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { sendAccountDeleted } from '@/lib/email/resend'
import { z } from 'zod'
import { sanitizeText } from '@/lib/utils/validate'

// ── GET PROFILE ─────────────────────────────────────────────────────────────
export const GET = withAuth(async (req, user) => {
  try {
    await connectDB()
    const dbUser = await User.findOne({ uid: user.uid })
      .select('displayName email isLpuVerified photoURL bio createdAt role')
      .lean()
      
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json(dbUser, { status: 200 })
  } catch (error) {
    console.error('[/api/user/me GET error]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

// ── UPDATE PROFILE (Fix 3: Sanitization) ────────────────────────────────────
export const PATCH = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    
    // Validate & Sanitise
    const profileSchema = z.object({
      displayName: z.string().min(2).max(50).transform(s => sanitizeText(s)).optional(),
      bio: z.string().max(200).transform(s => sanitizeText(s)).optional(),
    })

    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', issues: parsed.error.format() }, { status: 400 })
    }

    await connectDB()
    const updatedUser = await User.findOneAndUpdate(
      { uid: user.uid },
      { $set: parsed.data },
      { new: true }
    ).select('displayName photoURL bio')

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('[/api/user/me PATCH error]', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
})

// ── COMPLETE CASCADE DELETE (Fix 5) ─────────────────────────────────────────
export const DELETE = withAuth(async (req, user) => {
  try {
    await connectDB()
    
    // Find the MongoDB user first for ID and email
    const dbUser = await User.findOne({ uid: user.uid })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const user_id = dbUser._id
    const userEmail = dbUser.email

    // STEP 1: Hard delete all listings + purge Cloudinary images
    const userListings = await Listing.find({ seller: user_id })
    const allImages: string[] = []
    userListings.forEach(l => {
      if (l.images?.length) allImages.push(...l.images)
    })

    if (allImages.length > 0) {
      await deleteImages(allImages).catch(err => console.error('[CASCADE] Cloudinary wipe failed:', err))
    }
    await Listing.deleteMany({ seller: user_id })

    // STEP 2: Anonymise AdminActivity (Detach from deleted UID)
    await AdminActivity.updateMany(
      { actor: user_id },
      { $set: { actor: null, actorType: 'deleted_user' } }
    )

    // STEP 3: Delete all Reports filed BY this user
    await Report.deleteMany({ reportedBy: user_id })

    // STEP 4: Delete all ContactMessages by this user
    await ContactMessage.deleteMany({ userId: user_id })

    // STEP 5: Delete MongoDB User document
    await User.findByIdAndDelete(user_id)

    // STEP 6: Delete Firebase account
    try {
      await adminAuth.deleteUser(user.uid)
    } catch (e) {
      console.error('[CASCADE] Firebase delete failed:', e)
      // Continue regardless - we already deleted local data
    }

    // STEP 7: Clear session cookies
    const res = NextResponse.json({ 
      success: true, 
      message: 'Account and all associated assets irreversibly erased.' 
    })
    
    await clearAuthCookies()

    // STEP 8: Send confirmation email
    await sendAccountDeleted(userEmail).catch(err => console.error('[CASCADE] Email failed:', err))

    return res

  } catch (error) {
    console.error('[/api/user/me DELETE error]', error)
    return NextResponse.json({ error: 'Database transaction failed during cascade sweep' }, { status: 500 })
  }
})
