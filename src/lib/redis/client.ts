import { Redis } from '@upstash/redis'

// Single Redis instance — reused across serverless invocations
declare global {
  var redis: Redis | undefined
}

const redis = global.redis ?? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis
}

export default redis

