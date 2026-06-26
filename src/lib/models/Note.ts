import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  storagePrefix: string;
  itemId: string;
  note: string;
}

const NoteSchema: Schema = new Schema({
  storagePrefix: { type: String, required: true },
  itemId: { type: String, required: true },
  note: { type: String, required: true },
});

NoteSchema.index({ storagePrefix: 1, itemId: 1 }, { unique: true });

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
