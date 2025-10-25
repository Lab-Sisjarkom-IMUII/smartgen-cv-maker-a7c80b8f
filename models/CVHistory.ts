import mongoose, { Schema, model, models, Document } from 'mongoose'

// CV History Document Interface
export interface ICVHistory extends Document {
  cvId: string
  userId: string
  snapshot: any // Full CV data snapshot
  changeDescription?: string
  version: number
  createdAt: Date
}

const CVHistorySchema = new Schema<ICVHistory>(
  {
    cvId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changeDescription: {
      type: String,
      default: 'Manual save',
    },
    version: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
CVHistorySchema.index({ cvId: 1, version: -1 })
CVHistorySchema.index({ userId: 1, createdAt: -1 })

// Limit history to last 20 versions per CV (auto-cleanup old versions)
CVHistorySchema.pre('save', async function() {
  const count = await CVHistory.countDocuments({ cvId: this.cvId })
  
  if (count >= 20) {
    // Delete oldest versions, keep only 19 (so with new one = 20)
    const oldVersions = await CVHistory.find({ cvId: this.cvId })
      .sort({ version: 1 })
      .limit(count - 19)
      .select('_id')
    
    await CVHistory.deleteMany({
      _id: { $in: oldVersions.map(v => v._id) }
    })
  }
})

// Export model
export const CVHistory = models.CVHistory || model<ICVHistory>('CVHistory', CVHistorySchema)
