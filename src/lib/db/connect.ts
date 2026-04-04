import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local')
}

// Cached connection for serverless — prevents exhausting connections
declare global {
  var mongoose: { conn: any; promise: any } | undefined
}

let cached = global.mongoose ?? { conn: null, promise: null }
global.mongoose = cached

export async function connectDB() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] Connection reused:', !!cached.conn)
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5, // Atlas M0 optimization (limit is 500 across all users)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    })
  }


  cached.conn = await cached.promise
  return cached.conn
}
