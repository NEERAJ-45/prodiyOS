import mongoose, { Schema, type Types } from 'mongoose';

export type DocKind = 'file' | 'folder';

export interface IDoc {
  id: string;
  title: string;
  kind: DocKind;
  parentId: string | null;
  category: string;
  status: 'TO_READ' | 'READING' | 'COMPLETED' | 'REFERENCE';
  progress: number;
  fileUrl: string;
  fileData?: Buffer;
  fileType: string;
  mimeType: string;
  size: number;
  gridFsId?: Types.ObjectId | null;
  fileName: string;
  deletedAt?: Date | null;
  trashedFrom?: string | null;
  userEmail: string;
}

const DocSchema = new Schema<IDoc>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    kind: { type: String, enum: ['file', 'folder'], default: 'file' },
    parentId: { type: String, default: null },
    category: { type: String, default: 'other' },
    status: {
      type: String,
      enum: ['TO_READ', 'READING', 'COMPLETED', 'REFERENCE'],
      default: 'TO_READ',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    fileUrl: { type: String, default: '' },
    fileData: { type: Buffer, default: null, select: false },
    fileType: { type: String, default: '' },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    gridFsId: { type: Schema.Types.ObjectId, default: null },
    fileName: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
    trashedFrom: { type: String, default: null },
    userEmail: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

DocSchema.index({ userEmail: 1, parentId: 1, deletedAt: 1, kind: 1, title: 1 });
DocSchema.index({ userEmail: 1, parentId: 1, title: 1 });
DocSchema.index({ userEmail: 1, deletedAt: 1, updatedAt: -1 });
DocSchema.index({ userEmail: 1, deletedAt: 1, title: 1 });
DocSchema.index({ userEmail: 1, kind: 1, parentId: 1 });

export default mongoose.models.Doc || mongoose.model<IDoc>('Doc', DocSchema);
