import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomQABook {
  slug: string;
  title: string;
  totalQuestions: number;
  sections: Array<{
    id: string;
    title: string;
    questions: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
  }>;
}

export interface ICustomQA extends Document {
  userEmail: string;
  activeBookSlug: string;
  books: ICustomQABook[];
  updatedAt: string;
}

const CustomQASchema = new Schema({
  userEmail: { type: String, required: true, default: 'NEERAJ' },
  activeBookSlug: { type: String, required: true, default: 'java-prep' },
  books: [{
    slug: { type: String, required: true },
    title: { type: String, required: true },
    totalQuestions: { type: Number, required: true, default: 0 },
    sections: [{
      id: { type: String, required: true },
      title: { type: String, required: true },
      questions: [{
        id: { type: String, required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }]
    }]
  }],
  updatedAt: { type: String, required: true }
}, {
  timestamps: false,
});

CustomQASchema.index({ userEmail: 1 }, { unique: true });

export default mongoose.models.CustomQA || mongoose.model<ICustomQA>('CustomQA', CustomQASchema);
