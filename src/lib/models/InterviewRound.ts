import mongoose, { Schema, Document } from 'mongoose';
import type { ApplicationStatus } from './Application';

export interface IInterviewRound extends Document {
  id: string;
  userEmail: string;
  applicationId: string;
  roundType: ApplicationStatus;
  date: Date;
  notes: string;
  selfRating: number;
}

const InterviewRoundSchema: Schema = new Schema({
  id:            { type: String, required: true, unique: true },
  userEmail:     { type: String, required: true, index: true },
  applicationId: { type: String, required: true, index: true },
  roundType:     { type: String, enum: ['APPLIED', 'PHONE_SCREEN', 'TECH_ROUND_1', 'TECH_ROUND_2', 'SYSTEM_DESIGN', 'HR_CULTURE', 'OFFER', 'REJECTED'], required: true },
  date:          { type: Date, required: true },
  notes:         { type: String, default: '' },
  selfRating:    { type: Number, min: 1, max: 5, default: 3 },
}, { timestamps: true });

export default mongoose.models.InterviewRound || mongoose.model<IInterviewRound>('InterviewRound', InterviewRoundSchema);
