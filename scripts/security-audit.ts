import { connectDB } from '../src/lib/db/connect'
import Listing from '../src/lib/db/models/Listing'
import User from '../src/lib/db/models/User'
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function runAudit() {
  console.log('🛡️ Starting UniDeal Security & Privacy Audit...')
  
  await connectDB()
  
  // 1. Audit: Check for raw phone leaks in public-facing listings
  const publicListings = await Listing.find({ status: 'approved' }).limit(5).lean()
  
  console.log('\n--- Privacy Shield Audit (Listing Detail) ---')
  for (const l of publicListings) {
    // Simulated API response check
    const rawListing = l as any
    if (rawListing.whatsappNumber || rawListing.phone) {
      console.error(`❌ FAILURE: Privacy Leak in listing ${l.slug}. Raw field detected.`)
    } else {
      console.log(`✅ PASS: Listing ${l.slug} is shielded.`)
    }
  }

  // 2. Audit: Check for User Model default suppression
  const someUser = await User.findOne().lean()
  if (someUser && (someUser as any).whatsappNumber) {
    console.error('❌ FAILURE: User model "select:false" policy bypassed in standard find().')
  } else {
    console.log('✅ PASS: User.whatsappNumber is suppressed by default policy.')
  }

  // 3. Audit: Verify Admin Audit Integrity
  const AdminActivity = mongoose.models.AdminActivity || mongoose.model('AdminActivity', new mongoose.Schema({}))
  const revealLogs = await AdminActivity.find({ action: 'ADMIN_CONTACT_REVEAL' }).countDocuments()
  console.log(`\n--- Compliance Audit ---`)
  console.log(`📊 Total Contact Reveals Logged: ${revealLogs}`)
  
  if (revealLogs > 0) {
    console.log('✅ PASS: Administrative PII access is being audited.')
  } else {
    console.warn('⚠️ WARNING: No PII access logs found. Verify reveal flow is being used.')
  }

  console.log('\n🛡️ Audit Complete.')
  process.exit(0)
}

runAudit().catch(err => {
  console.error('Audit crashed:', err)
  process.exit(1)
})
