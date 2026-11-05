import mongoose, { Schema } from 'mongoose';

export interface IUploadChunk {
  uploadId: string;
  index: number;
  data: Buffer;
  createdAt: Date;
}

const UploadChunkSchema = new Schema<IUploadChunk>(
  {
    uploadId: { type: String, required: true },
    index: { type: Number, required: true },
    data: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

UploadChunkSchema.index({ uploadId: 1, index: 1 }, { unique: true });
UploadChunkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.UploadChunk ||
  mongoose.model<IUploadChunk>('UploadChunk', UploadChunkSchema);
