import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleEvent {
  id: string; date: string; startTime?: string; endTime?: string; allDay: boolean;
  category: string; title: string; description?: string; status: string; completed: boolean; notes?: string;
}
export interface ISchedulePlan extends Document {
  scheduleId: string; userEmail: string; name: string; sourceFileName: string;
  startDate: string; endDate: string; events: IScheduleEvent[]; createdAt: Date; updatedAt: Date;
}

const EventSchema = new Schema<IScheduleEvent>({
  id: { type: String, required: true }, date: { type: String, required: true }, startTime: String, endTime: String,
  allDay: { type: Boolean, default: true }, category: { type: String, required: true }, title: { type: String, required: true },
  description: String, status: { type: String, default: 'Pending' }, completed: { type: Boolean, default: false }, notes: String,
}, { _id: false });

const SchedulePlanSchema = new Schema<ISchedulePlan>({
  scheduleId: { type: String, required: true }, userEmail: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true }, sourceFileName: { type: String, required: true },
  startDate: { type: String, required: true }, endDate: { type: String, required: true }, events: { type: [EventSchema], default: [] },
}, { timestamps: true });
SchedulePlanSchema.index({ userEmail: 1, scheduleId: 1 }, { unique: true });

export default mongoose.models.SchedulePlan || mongoose.model<ISchedulePlan>('SchedulePlan', SchedulePlanSchema);
