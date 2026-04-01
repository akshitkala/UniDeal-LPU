import Listing from '../src/lib/db/models/Listing'
import { connectDB } from '../src/lib/db/connect'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function approveAll() {
  await connectDB()
  const result = await (Listing as any).updateMany(
    { status: 'pending' },
    { 
      $set: { 
        status: 'approved',
        aiFlagged: false,
        aiUnavailable: false,
        isExpired: false
      } 
    }
  )
  console.log(`Updated ${result.modifiedCount} items to approved status.`)
  process.exit(0)
}

approveAll().catch(err => {
    console.error(err)
    process.exit(1)
})
