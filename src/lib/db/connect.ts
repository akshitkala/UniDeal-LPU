import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local')
}

// Cached connection for serverless — prevents exhausting connections on M0
declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
