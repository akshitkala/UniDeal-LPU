import mongoose, { Schema, Document, Model } from 'mongoose'

export type ActorType = 'user' | 'system' | 'deleted_user'
export type TargetModel = 'User' | 'Listing' | 'Category' | 'System'

export interface IAdminActivity extends Document {
  actor: mongoose.Types.ObjectId | null  // null if deleted_user
  actorType: ActorType
  target?: mongoose.Types.ObjectId
  targetModel?: TargetModel
  action: string
  metadata?: Record<string, unknown>
  reason?: string    // mandatory for sensitive actions (ban, delete, reject)
  ipAddress?: string // stored in full — masked in UI display
  timestamp: Date
}

const AdminActivitySchema = new Schema<IAdminActivity>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorType: {
      type: String,
      enum: ['user', 'system', 'deleted_user'],
      required: true,
    },
    target: { type: Schema.Types.ObjectId, refPath: 'targetModel' },
    targetModel: {
      type: String,
      enum: ['User', 'Listing', 'Category', 'System'],
    },
    action: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    reason: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
)

// Audit log is read-only — no updates allowed via model
AdminActivitySchema.pre('findOneAndUpdate', function () {
  throw new Error('AdminActivity records are immutable — audit log cannot be modified')
})

const AdminActivity: Model<IAdminActivity> =
  mongoose.models.AdminActivity ||
  mongoose.model<IAdminActivity>('AdminActivity', AdminActivitySchema)

export default AdminActivity
