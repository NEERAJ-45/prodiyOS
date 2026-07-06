import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  id: string;
  title: string;
  author: string;
  status: 'TO_READ' | 'READING' | 'COMPLETED' | 'REFERENCE';
  progress: number;
  rating: number;
  userEmail: string;
}

const BookSchema: Schema = new Schema({
  id:        { type: String, required: true, unique: true },
  title:     { type: String, required: true },
  author:    { type: String, default: '' },
  status:    { type: String, enum: ['TO_READ', 'READING', 'COMPLETED', 'REFERENCE'], default: 'TO_READ' },
  progress:  { type: Number, default: 0, min: 0, max: 100 },
  rating:    { type: Number, default: 0, min: 0, max: 5 },
  userEmail: { type: String, required: true, index: true },
});

export default mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
