import mongoose, { Schema, Document } from 'mongoose';

export interface IArticleCodeFile {
  name: string;
  language: string;
  content: string;
}

export interface IArticleAsset {
  name: string;
  mimeType: string;
  data: string;
}

export interface IArticle extends Document {
  id: string;
  title: string;
  content: string;
  userEmail: string;
  codeFiles: IArticleCodeFile[];
  assets: IArticleAsset[];
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  userEmail: { type: String, required: true, index: true },
  codeFiles: [{
    name: { type: String, required: true },
    language: { type: String, default: 'text' },
    content: { type: String, default: '' },
  }],
  assets: [{
    name: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    data: { type: String, default: '' },
  }],
}, {
  timestamps: true,
  toJSON: { minimize: false },
  toObject: { minimize: false },
});

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);
