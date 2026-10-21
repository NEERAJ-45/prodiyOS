import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaskDoc extends Document {
  userEmail: string;
  tasks: unknown[];
  updatedAt: string;
}

const TaskDocSchema: Schema = new Schema({
  userEmail: { type: String, required: true, unique: true },
  tasks: { type: [Schema.Types.Mixed], default: [] },
  updatedAt: { type: String, required: true },
});

const TaskDoc: Model<ITaskDoc> =
  mongoose.models.TaskDoc || mongoose.model<ITaskDoc>('TaskDoc', TaskDocSchema);

export default TaskDoc;
