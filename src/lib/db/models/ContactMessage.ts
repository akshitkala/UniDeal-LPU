import mongoose, { Schema, Document, Model } from 'mongoose'

export type ContactSubject =
  | 'bug_report'
  | 'ban_appeal'
  | 'listing_dispute'
  | 'general'
  | 'complaint'
  | 'other'

export type ContactStatus = 'open' | 'resolved'

export interface IContactMessage extends Document {
  name: string
  email: string
  subject: ContactSubject
  message: string
  userId?: mongoose.Types.ObjectId  // null for guests
  ipAddress?: string
  status: ContactStatus
  createdAt: Date
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: {
      type: String,
      enum: ['bug_report', 'ban_appeal', 'listing_dispute', 'general', 'complaint', 'other'],
      required: true,
    },
    message: { type: String, required: true, maxlength: 1000 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ipAddress: { type: String },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Force cache clear for schema updates in development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.ContactMessage
}

const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema)

export default ContactMessage
