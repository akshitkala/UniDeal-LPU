import Listing from '../src/lib/db/models/Listing'
import { connectDB } from '../src/lib/db/connect'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function debug() {
  await connectDB()
  const stats = await (Listing as any).aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        aiFlagged: { $sum: { $cond: ['$aiFlagged', 1, 0] } },
        isExpired: { $sum: { $cond: ['$isExpired', 1, 0] } }
      }
    }
  ])
  console.log('Listing Stats:', JSON.stringify(stats, null, 2))
  const total = await (Listing as any).countDocuments({})
  console.log('Total Listings:', total)
  process.exit(0)
}

debug()
