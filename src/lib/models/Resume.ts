import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userEmail: string;
  title: string;
  company: string;
  latexSource: string;
  pdfData: Buffer | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema: Schema = new Schema({
  userEmail: { type: String, required: true, index: true },
  title: { type: String, required: true, default: 'Untitled Resume' },
  company: { type: String, default: '' },
  latexSource: { type: String, required: true },
  pdfData: { type: Buffer, default: null },
  version: { type: Number, default: 1 },
}, {
  timestamps: true,
  toJSON: { minimize: false },
  toObject: { minimize: false },
});

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
