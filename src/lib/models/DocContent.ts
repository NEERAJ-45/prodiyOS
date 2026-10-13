import mongoose, { Schema, Document } from 'mongoose';

export interface IDocContent extends Document {
  docId: string;
  title: string;
  category: string;
  content: string;
  contentLength: number;
  indexedAt: Date;
}

const DocContentSchema: Schema = new Schema({
  docId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'other' },
  content: { type: String, default: '' },
  contentLength: { type: Number, default: 0 },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

DocContentSchema.index({ title: 'text', content: 'text' }, {
  weights: { title: 10, content: 1 },
  name: 'doc_content_text_index',
});

export default mongoose.models.DocContent || mongoose.model<IDocContent>('DocContent', DocContentSchema);
