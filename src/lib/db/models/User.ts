import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  uid: string           // Firebase UID
  email: string         // from Google — read-only
  displayName: string   // editable — defaults to email prefix
  photoURL: string      // from Google
  role: 'user' | 'admin'
  isActive: boolean     // false = banned
  trustLevel: 'new' | 'trusted' | 'flagged'
  whatsappNumber?: string  // select:false — NEVER in any API response
  bio?: string
  totalListings: number
  activeListings: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true },
    photoURL: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    trustLevel: { type: String, enum: ['new', 'trusted', 'flagged'], default: 'new' },
    // CRITICAL: select:false — this field is NEVER returned in any query by default
    whatsappNumber: { type: String, select: false },
    bio: { type: String, maxlength: 200 },
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Prevent model re-compilation in dev hot-reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
