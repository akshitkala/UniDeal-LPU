import mongoose, { Schema, Document, Model } from 'mongoose'

export type ReportReason =
  | 'fake_listing'
  | 'wrong_price'
  | 'inappropriate'
  | 'already_sold'
  | 'spam'
  | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface IReport extends Document {
  listing: mongoose.Types.ObjectId
  reportedBy: mongoose.Types.ObjectId
  reason: ReportReason
  description?: string
  status: ReportStatus
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  createdAt: Date
}

const ReportSchema = new Schema<IReport>(
  {
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['fake_listing', 'wrong_price', 'inappropriate', 'already_sold', 'spam', 'other'],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema)

export default Report
