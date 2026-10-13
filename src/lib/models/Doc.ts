import mongoose, { Schema } from 'mongoose';

export interface IDoc {
  id: string;
  title: string;
  category: string;
  status: 'TO_READ' | 'READING' | 'COMPLETED' | 'REFERENCE';
  progress: number;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'md';
  fileName: string;
  userEmail: string;
}

const DocSchema = new Schema<IDoc>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, default: 'other' },
    status: {
      type: String,
      enum: ['TO_READ', 'READING', 'COMPLETED', 'REFERENCE'],
      default: 'TO_READ',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx', 'md'], required: true },
    fileName: { type: String, default: '' },
    userEmail: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Doc || mongoose.model<IDoc>('Doc', DocSchema);
