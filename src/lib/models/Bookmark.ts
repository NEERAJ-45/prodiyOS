import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
  id: string;
  bookId: string;
  pageNumber: number;
  note?: string;
  userEmail: string;
}

const BookmarkSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  bookId: { type: String, required: true, index: true },
  pageNumber: { type: Number, required: true },
  note: { type: String, default: '' },
  userEmail: { type: String, required: true, index: true },
}, { timestamps: true });

BookmarkSchema.index({ bookId: 1, pageNumber: 1, userEmail: 1 });

export default mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
