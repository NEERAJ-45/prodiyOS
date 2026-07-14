import mongoose, { Schema, Document } from 'mongoose';

interface IFeature {
  name: string;
  done: boolean;
}

export interface IProject extends Document {
  id: string;
  name: string;
  description: string;
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED' | 'MAINTAINING' | 'ARCHIVED';
  technologies: string[];
  features: IFeature[];
  linkedConcepts: number;
  vision: string;
  architecture: string;
  architectureImage?: string;
  docs?: { name: string; url: string }[];
  lessons: string;
  progress: number;
  userEmail: string;
}

const FeatureSchema: Schema = new Schema({
  name: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const ProjectSchema: Schema = new Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  description:  { type: String, default: '' },
  status:       { type: String, enum: ['IDEA', 'IN_PROGRESS', 'COMPLETED', 'MAINTAINING', 'ARCHIVED'], default: 'IDEA' },
  technologies: [{ type: String }],
  features:     [FeatureSchema],
  linkedConcepts: { type: Number, default: 0 },
  vision:       { type: String, default: '' },
  architecture: { type: String, default: '' },
  architectureImage: { type: String, default: '' },
  docs: [{ name: { type: String, default: '' }, url: { type: String, default: '' } }],
  lessons:      { type: String, default: '' },
  progress:     { type: Number, default: 0, min: 0, max: 100 },
  userEmail:    { type: String, required: true, index: true },
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
