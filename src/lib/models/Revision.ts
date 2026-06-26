import mongoose, { Schema, Document } from 'mongoose';

export interface IRevision extends Document {
  id: string;
  concept: string;
  stage: number;
  dueDate: string;
  completed: boolean;
}

const RevisionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  concept: { type: String, required: true },
  stage: { type: Number, required: true, default: 0 },
  dueDate: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
});

export default mongoose.models.Revision || mongoose.model<IRevision>('Revision', RevisionSchema);
