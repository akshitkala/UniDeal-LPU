import redis from '@/lib/redis/client';

/**
 * Generic rate limiter using Upstash Redis.
 * Capped at 'limit' attempts per 'windowSeconds'.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const current = await redis.incr(key);
    
    // Set expiry on first attempt
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return { 
      allowed: current <= limit, 
      remaining: Math.max(0, limit - current) 
    };
  } catch (error) {
    // Failsafe: if Redis is down, allow the request but log error
    console.error('[RateLimit Error]', error);
    return { allowed: true, remaining: 1 };
  }
}

/**
 * Specific helper for Admin actions (20/min per UID)
 */
export async function adminRateLimit(adminUid: string) {
  return checkRateLimit(`admin:${adminUid}`, 20, 60);
}
