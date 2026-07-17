import mongoose, { Schema, Document } from 'mongoose';

export interface CustomRoadmapQuestion {
  id: number;
  title: string;
  difficulty: string;
  link: string;
}

export interface ICustomRoadmap extends Document {
  slug: string;
  title: string;
  description: string;
  storageKey: string;
  questions: CustomRoadmapQuestion[];
  color: string;
  hours: number;
  difficulty: string;
  userEmail?: string;
}

const CustomRoadmapQuestionSchema: Schema = new Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  difficulty: { type: String, required: true },
  link: { type: String, default: '' },
});

const CustomRoadmapSchema: Schema = new Schema({
  slug: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  storageKey: { type: String, required: true },
  questions: { type: [CustomRoadmapQuestionSchema], default: [] },
  color: { type: String, default: '#8b5cf6' },
  hours: { type: Number, default: 0 },
  difficulty: { type: String, default: 'Medium' },
  userEmail: { type: String, required: true, default: 'NEERAJ' },
});

CustomRoadmapSchema.index({ slug: 1, userEmail: 1 }, { unique: true });

export default mongoose.models.CustomRoadmap || mongoose.model<ICustomRoadmap>('CustomRoadmap', CustomRoadmapSchema);
