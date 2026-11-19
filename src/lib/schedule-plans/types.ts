export type ScheduleEventStatus = 'Pending' | 'In Progress' | 'Done';

export interface ScheduleEvent {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  category: string;
  title: string;
  description?: string;
  status: ScheduleEventStatus;
  completed: boolean;
  notes?: string;
}

export interface SchedulePlan {
  scheduleId: string;
  name: string;
  sourceFileName: string;
  startDate: string;
  endDate: string;
  events: ScheduleEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportedScheduleDraft {
  date?: string;
  legacyDay?: number;
  startTime?: string;
  endTime?: string;
  category: string;
  title: string;
  status: ScheduleEventStatus;
  notes?: string;
  allDay: boolean;
}

export interface CsvParseResult {
  format: 'legacy' | 'events';
  drafts: ImportedScheduleDraft[];
  errors: string[];
}
