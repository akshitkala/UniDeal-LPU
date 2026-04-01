import { Redis } from '@upstash/redis'

// Single Redis instance — reused across serverless invocations
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default redis
