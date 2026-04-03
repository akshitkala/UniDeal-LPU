import mongoose, { Schema, Document, Model } from 'mongoose'

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'expired'
export type ListingCondition = 'new' | 'like-new' | 'good' | 'used' | 'damaged'

export interface IAIVerification {
  checked: boolean
  flagged: boolean
  flags: string[]
  confidence: number
  reason: string
  checkedAt?: Date
}

export interface IListing extends Document {
  title: string
  description: string
  price: number
  negotiable: boolean
  category: mongoose.Types.ObjectId
  condition: ListingCondition
  images: string[]         // max 2 Cloudinary URLs
  seller: mongoose.Types.ObjectId
  sellerBanned: boolean    // denormalised — updated atomically on ban/unban
  status: ListingStatus
  isDeleted: boolean       // SELLER self-delete ONLY — admin uses hard delete
  rejectionReason?: string
  aiFlagged: boolean       // flagged by AI OR when AI is unavailable
  aiUnavailable: boolean   // true = AI was down at submission time
  aiVerification: IAIVerification
  slug: string             // unique — nanoid suffix
  views: number
  bumpedAt?: Date
  bumpCount: number        // max 3 lifetime
  lastBumpAt?: Date
  expiresAt: Date          // createdAt/bumpedAt + 60 days
  isExpired: boolean
  soldAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AIVerificationSchema = new Schema<IAIVerification>(
  {
    checked: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    flags: [{ type: String }],
    confidence: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    checkedAt: { type: Date },
  },
  { _id: false }
)

const ListingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0, max: 999999 },
    negotiable: { type: Boolean, default: false },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'used', 'damaged'],
      required: true,
    },
    images: {
      type: [String],
      validate: { validator: (v: string[]) => v.length <= 2, message: 'Max 2 images allowed' },
    },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Denormalised for query performance — no join needed on feed filter
    sellerBanned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'sold', 'expired'],
      default: 'pending',
    },
    // CRITICAL: isDeleted is ONLY for seller self-deletion via My Dashboard
    // Admin deletion is a HARD DELETE — document is permanently removed
    isDeleted: { type: Boolean, default: false },
    rejectionReason: { type: String },
    // CRITICAL: aiFlagged:true means listing is NEVER shown in public feed
    // Also set to true when AI is unavailable (safety-first)
    aiFlagged: { type: Boolean, default: false },
    aiUnavailable: { type: Boolean, default: false },
    aiVerification: { type: AIVerificationSchema, default: () => ({}) },
    slug: { type: String, required: true, unique: true },
    views: { type: Number, default: 0 },
    bumpedAt: { type: Date },
    bumpCount: { type: Number, default: 0, max: 3 },
    lastBumpAt: { type: Date },
    expiresAt: { 
      type: Date, 
      required: true,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    isExpired: { type: Boolean, default: false },
    soldAt: { type: Date },
  },
  { timestamps: true }
)

// Compound Index: Feed Sort Order (Fix 1.1)
ListingSchema.index({ bumpedAt: -1, createdAt: -1 })

// Compound Index: Public Visibility Matrix (The 4 Mandatory Conditions) (Fix 1.1)
ListingSchema.index({ status: 1, isDeleted: 1, sellerBanned: 1, aiFlagged: 1 })

// Compound Index: Category Filtering (Fix 1.1)
ListingSchema.index({ category: 1, status: 1, sellerBanned: 1, aiFlagged: 1 })

// Single Field Indexes for Foreign Keys and Unique Constraints
ListingSchema.index({ seller: 1 })
ListingSchema.index({ createdAt: -1 })

// TTL Index for Expiry (Fix 1.1)
ListingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Text Index for Search (title + description)
ListingSchema.index({ title: 'text', description: 'text' })


// Set expiresAt to 60 days from creation on new documents
ListingSchema.pre('save', function () {
  if (this.isNew && !this.expiresAt) {
    const sixtyDays = 60 * 24 * 60 * 60 * 1000
    this.expiresAt = new Date(Date.now() + sixtyDays)
  }
})

const Listing: Model<IListing> =
  mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema)

export default Listing
