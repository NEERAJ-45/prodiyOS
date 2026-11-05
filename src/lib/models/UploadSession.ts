import mongoose, { Schema } from 'mongoose';

export interface IUploadSession {
  uploadId: string;
  userEmail: string;
  parentId: string | null;
  name: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: Date;
}

const UploadSessionSchema = new Schema<IUploadSession>(
  {
    uploadId: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true, index: true },
    parentId: { type: String, default: null },
    name: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, required: true },
    chunkCount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

UploadSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.UploadSession ||
  mongoose.model<IUploadSession>('UploadSession', UploadSessionSchema);
