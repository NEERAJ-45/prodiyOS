import mongoose, { Schema, Document } from 'mongoose';

export type ApplicationStatus =
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'TECH_ROUND_1'
  | 'TECH_ROUND_2'
  | 'SYSTEM_DESIGN'
  | 'HR_CULTURE'
  | 'OFFER'
  | 'REJECTED'
  | 'GHOSTED'
  | 'DIDNT_SHORTLIST';

export type ApplicationSource = 'LINKEDIN' | 'COMPANY_WEBSITE' | 'REFERRAL' | 'RECRUITER' | 'OTHER';

export type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IApplication extends Document {
  id: string;
  userEmail: string;
  company: string;
  role: string;
  appliedDate: Date;
  status: ApplicationStatus;
  source: ApplicationSource;
  priority: ApplicationPriority;
  notes: string;
  nextRoundDate: Date | null;
  pdfData: string;
}

const ApplicationSchema: Schema = new Schema({
  id:           { type: String, required: true, unique: true },
  userEmail:    { type: String, required: true, index: true },
  company:      { type: String, required: true },
  role:         { type: String, required: true },
  appliedDate:  { type: Date, required: true },
  status:       { type: String, enum: ['APPLIED', 'PHONE_SCREEN', 'TECH_ROUND_1', 'TECH_ROUND_2', 'SYSTEM_DESIGN', 'HR_CULTURE', 'OFFER', 'REJECTED', 'GHOSTED', 'DIDNT_SHORTLIST'], default: 'APPLIED' },
  source:       { type: String, enum: ['LINKEDIN', 'COMPANY_WEBSITE', 'REFERRAL', 'RECRUITER', 'OTHER'], default: 'OTHER' },
  priority:     { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  notes:        { type: String, default: '' },
  nextRoundDate: { type: Date, default: null },
  pdfData:       { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
