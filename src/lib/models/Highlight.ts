import mongoose, { Schema, Document } from 'mongoose';

export interface IHighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface IHighlight extends Document {
  id: string;
  bookId: string;
  pageNumber: number;
  text: string;
  color: string;
  rects: IHighlightRect[];
  userEmail: string;
}

const HighlightSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  bookId: { type: String, required: true, index: true },
  pageNumber: { type: Number, required: true },
  text: { type: String, required: true },
  color: { type: String, default: '#fbbf24' },
  rects: [{
    top: { type: Number, required: true },
    left: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  }],
  userEmail: { type: String, required: true, index: true },
}, { timestamps: true });

HighlightSchema.index({ bookId: 1, pageNumber: 1, userEmail: 1 });

export default mongoose.models.Highlight || mongoose.model<IHighlight>('Highlight', HighlightSchema);
