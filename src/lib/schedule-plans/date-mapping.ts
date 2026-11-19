import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import type { ScheduleEvent } from './types';

export function eventDateRange(events: ScheduleEvent[]): { startDate: string; endDate: string } {
  const dates = events.map((event) => event.date).sort();
  return { startDate: dates[0] ?? '', endDate: dates[dates.length - 1] ?? '' };
}

export function datesForMonth(month: Date): Date[] {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridStart = addDays(start, -start.getDay());
  const gridEnd = addDays(end, 6 - end.getDay());
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function dateKey(date: Date): string { return format(date, 'yyyy-MM-dd'); }
export function parseDateKey(value: string): Date { return parseISO(`${value}T12:00:00`); }
