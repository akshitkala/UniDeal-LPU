import mongoose, { Schema, Document, Model } from 'mongoose'

export type ApprovalMode = 'manual' | 'ai_flagging' | 'automatic'

export interface ISystemConfig extends Document<string> {
  _id: string          // fixed to 'global' — enforces singleton
  approvalMode: ApprovalMode
  maintenanceMode: boolean
  allowNewListings: boolean
  updatedBy?: mongoose.Types.ObjectId
  updatedAt: Date
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    _id: { type: String, default: 'global' },
    // default: ai_flagging — AI-flagged always go to queue regardless of mode
    approvalMode: {
      type: String,
      enum: ['manual', 'ai_flagging', 'automatic'],
      default: 'ai_flagging',
    },
    maintenanceMode: { type: Boolean, default: false },
    allowNewListings: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
)

const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig ||
  mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema)

// Helper to get or create the singleton config
export async function getSystemConfig(): Promise<ISystemConfig> {
  let config = await SystemConfig.findById('global')
  if (!config) {
    config = await SystemConfig.create({ _id: 'global' })
  }
  return config
}

export default SystemConfig
