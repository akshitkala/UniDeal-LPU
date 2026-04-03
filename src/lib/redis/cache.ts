import redis from './client'

/**
 * CACHE KEYS: Centralized source of truth for Redis namespaces.
 * TTLs are short but effective for campus-level spikes.
 */
export const CACHE_KEYS = {
  BROWSE_FEED: (hash: string) => `feed:browse:${hash}`,
  LISTING: (slug: string) => `listing:${slug}`,
  CATEGORIES: 'categories:active',
}

/**
 * Invalidate all browse feed caches.
 * Should be called whenever a listing is: Created, Approved, Deleted, Sold, or Expired.
 * Also when a user is banned or a listing is bumped.
 */
export async function invalidateBrowseCache() {
  try {
    const keys = await redis.keys('feed:browse:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (err) {
    console.error('[Redis] Cache invalidation failed:', err)
  }
}

/**
 * Invalidate a specific listing detail cache.
 */
export async function invalidateListing(slug: string) {
  try {
    await redis.del(CACHE_KEYS.LISTING(slug))
    await invalidateBrowseCache() // Most listing changes affect the feed
  } catch (err) {
    console.error('[Redis Invalidate Listing Error]', err)
  }
}
