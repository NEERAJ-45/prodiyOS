import mongoose, { Schema, Document } from 'mongoose';

export interface IBookContent extends Document {
  bookId: string;
  sourceType: 'library' | 'tracked';
  title: string;
  author: string;
  category: string;
  content: string;
  contentLength: number;
  indexedAt: Date;
}

const BookContentSchema: Schema = new Schema({
  bookId: { type: String, required: true, unique: true },
  sourceType: { type: String, enum: ['library', 'tracked'], required: true },
  title: { type: String, required: true },
  author: { type: String, default: '' },
  category: { type: String, default: 'other' },
  content: { type: String, default: '' },
  contentLength: { type: Number, default: 0 },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

BookContentSchema.index({ title: 'text', content: 'text' }, {
  weights: { title: 10, content: 1 },
  name: 'book_content_text_index',
});

export default mongoose.models.BookContent || mongoose.model<IBookContent>('BookContent', BookContentSchema);
