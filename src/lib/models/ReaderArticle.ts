import mongoose, { Schema, Document } from 'mongoose';

export interface IReaderArticle extends Document {
  url: string;
  title: string;
  html: string;
  searchText: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReaderArticleSchema: Schema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    html: { type: String, default: '' },
    searchText: { type: String, default: '' },
    source: { type: String, default: 'medium' },
  },
  { timestamps: true }
);

export default mongoose.models.ReaderArticle ||
  mongoose.model<IReaderArticle>('ReaderArticle', ReaderArticleSchema);
