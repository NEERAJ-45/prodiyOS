import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  userEmail: string;
  success: boolean;
  timestamp: Date;
  ip?: string;
  failReason?: string;
}

const LoginAttemptSchema: Schema = new Schema({
  userEmail:  { type: String, required: true, index: true },
  success:    { type: Boolean, required: true },
  timestamp:  { type: Date, required: true, default: Date.now },
  ip:         { type: String },
  failReason: { type: String },
});

// TTL index: auto-delete attempts older than 90 days
LoginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);
