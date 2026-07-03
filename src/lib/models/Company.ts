import mongoose, { Schema, Document } from 'mongoose';

export interface IContact {
  name: string;
  role: string;
  email: string;
  linkedin: string;
}

export interface ICompany extends Document {
  id: string;
  userEmail: string;
  name: string;
  compRange: string;
  techStack: string[];
  contacts: IContact[];
  whyInterested: string;
  notes: string;
}

const ContactSchema: Schema = new Schema({
  name:     { type: String, default: '' },
  role:     { type: String, default: '' },
  email:    { type: String, default: '' },
  linkedin: { type: String, default: '' },
});

const CompanySchema: Schema = new Schema({
  id:           { type: String, required: true, unique: true },
  userEmail:    { type: String, required: true, index: true },
  name:         { type: String, required: true },
  compRange:    { type: String, default: '' },
  techStack:    [{ type: String }],
  contacts:     [ContactSchema],
  whyInterested: { type: String, default: '' },
  notes:        { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
