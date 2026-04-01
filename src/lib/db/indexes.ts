import mongoose from 'mongoose'
import { connectDB } from './connect'

/**
 * All 15 indexes defined per LLD Section 2.
 * Called once on app boot — safe to call multiple times (createIndexes is idempotent).
 * CRITICAL: No query should run without hitting an index.
 */
export async function createIndexes(): Promise<void> {
  await connectDB()

  const db = mongoose.connection.db
  if (!db) throw new Error('DB not connected')

  // ── Listing indexes ──────────────────────────────────────────────────────
  const listingColl = db.collection('listings')

  // Browse feed primary sort — most critical
  await listingColl.createIndex({ bumpedAt: -1, createdAt: -1 })

  // Four-condition feed visibility filter (mandatory on EVERY public query)
  await listingColl.createIndex({
    status: 1,
    sellerBanned: 1,
    aiFlagged: 1,
    isDeleted: 1,
  })

  // Category filter with visibility
  await listingColl.createIndex({
    category: 1,
    status: 1,
    sellerBanned: 1,
    aiFlagged: 1,
  })

  // My Dashboard listings
  await listingColl.createIndex({ seller: 1 })

  // Listing detail page lookup (unique)
  await listingColl.createIndex({ slug: 1 }, { unique: true })

  // Admin queue — flagged + unavailable first
  await listingColl.createIndex({ aiFlagged: 1, aiUnavailable: 1, status: 1 })

  // TTL — Mongo will mark expired docs (cron job reads isExpired:false + expiresAt < now)
  await listingColl.createIndex({ expiresAt: 1 })

  // Full-text search on title + description
  await listingColl.createIndex({ title: 'text', description: 'text' })

  // ── User indexes ─────────────────────────────────────────────────────────
  const userColl = db.collection('users')
  await userColl.createIndex({ uid: 1 }, { unique: true })
  await userColl.createIndex({ email: 1 }, { unique: true })

  // ── AdminActivity indexes ─────────────────────────────────────────────────
  const activityColl = db.collection('adminactivities')
  await activityColl.createIndex({ timestamp: -1 })
  await activityColl.createIndex({ actor: 1, timestamp: -1 })

  // ── Report indexes ────────────────────────────────────────────────────────
  const reportColl = db.collection('reports')
  await reportColl.createIndex({ listing: 1, status: 1 })

  // ── Category indexes ──────────────────────────────────────────────────────
  const categoryColl = db.collection('categories')
  await categoryColl.createIndex({ order: 1, isActive: 1 })

  // ── ContactMessage indexes ────────────────────────────────────────────────
  const contactColl = db.collection('contactmessages')
  await contactColl.createIndex({ createdAt: -1 })

  console.log('[UniDeal] All 15 indexes created/verified')
}
