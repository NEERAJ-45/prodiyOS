import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomQAProgress extends Document {
  userEmail: string;
  progress: Record<string, { mastered: boolean; flagged: boolean }>;
  updatedAt: string;
}

const CustomQAProgressSchema = new Schema({
  userEmail: { type: String, required: true, default: 'NEERAJ' },
  // Mixed type to support flexible key-value maps of QuestionText -> { mastered, flagged }
  progress: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: String, required: true }
}, {
  timestamps: false,
});

CustomQAProgressSchema.index({ userEmail: 1 }, { unique: true });

export default mongoose.models.CustomQAProgress || mongoose.model<ICustomQAProgress>('CustomQAProgress', CustomQAProgressSchema);
