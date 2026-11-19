import type { CsvParseResult, ImportedScheduleDraft, ScheduleEventStatus } from './types';

const LEGACY_HEADERS = ['week', 'day', 'type', 'dsa task', 'spring boot task', 'system design task', 'mastery check (pass = done)', 'status', 'notes'];
const EVENT_HEADERS = ['date', 'start time', 'end time', 'category', 'task', 'status', 'notes'];

function parseCsvRows(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(field.trim()); field = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field.trim()); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); }
  return rows;
}

function normalize(value: string): string { return value.trim().toLowerCase(); }
function statusOf(value: string): ScheduleEventStatus {
  const normalized = normalize(value);
  if (normalized === 'done' || normalized === 'complete' || normalized === 'completed') return 'Done';
  if (normalized === 'in progress' || normalized === 'started') return 'In Progress';
  return 'Pending';
}
function indexOf(headers: string[], header: string): number { return headers.indexOf(normalize(header)); }

function parseLegacy(rows: string[][], headers: string[]): CsvParseResult {
  const errors: string[] = [];
  for (const header of LEGACY_HEADERS) if (!headers.includes(header)) errors.push(`Missing required column: ${header}`);
  if (errors.length) return { format: 'legacy', drafts: [], errors };

  const columns = Object.fromEntries(LEGACY_HEADERS.map((header) => [header, indexOf(headers, header)]));
  const drafts: ImportedScheduleDraft[] = [];
  rows.slice(1).forEach((row, rowIndex) => {
    const line = rowIndex + 2;
    const day = Number(row[columns.day]);
    const week = Number(row[columns.week]);
    if (!Number.isInteger(day) || day < 1) errors.push(`Row ${line}: Day must be a positive integer`);
    if (!Number.isInteger(week) || week < 1) errors.push(`Row ${line}: Week must be a positive integer`);
    const tasks: Array<[string, string]> = [
      ['DSA', row[columns['dsa task']] ?? ''],
      ['Spring Boot', row[columns['spring boot task']] ?? ''],
      ['System Design', row[columns['system design task']] ?? ''],
      ['Mastery Check', row[columns['mastery check (pass = done)']] ?? ''],
    ];
    for (const [category, title] of tasks) if (title.trim()) drafts.push({ legacyDay: day, category, title: title.trim(), status: statusOf(row[columns.status] ?? ''), notes: row[columns.notes] ?? '', allDay: true });
  });
  return { format: 'legacy', drafts: errors.length ? [] : drafts, errors };
}

function parseEvents(rows: string[][], headers: string[]): CsvParseResult {
  const errors: string[] = [];
  for (const header of EVENT_HEADERS) if (!headers.includes(header)) errors.push(`Missing required column: ${header}`);
  if (errors.length) return { format: 'events', drafts: [], errors };
  const columns = Object.fromEntries(EVENT_HEADERS.map((header) => [header, indexOf(headers, header)]));
  const drafts: ImportedScheduleDraft[] = [];
  rows.slice(1).forEach((row, rowIndex) => {
    const line = rowIndex + 2;
    const date = (row[columns.date] ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push(`Row ${line}: Date must use YYYY-MM-DD`);
    const startTime = (row[columns['start time']] ?? '').trim();
    const endTime = (row[columns['end time']] ?? '').trim();
    if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) errors.push(`Row ${line}: Start Time must use HH:mm`);
    if (endTime && !/^\d{2}:\d{2}$/.test(endTime)) errors.push(`Row ${line}: End Time must use HH:mm`);
    const title = (row[columns.task] ?? '').trim();
    if (!title) errors.push(`Row ${line}: Task is required`);
    drafts.push({ date, startTime: startTime || undefined, endTime: endTime || undefined, allDay: !startTime, category: (row[columns.category] ?? 'General').trim() || 'General', title, status: statusOf(row[columns.status] ?? ''), notes: row[columns.notes] ?? '' });
  });
  return { format: 'events', drafts: errors.length ? [] : drafts, errors };
}

export function parseScheduleCsv(text: string): CsvParseResult {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return { format: 'events', drafts: [], errors: ['CSV must contain a header and at least one data row'] };
  const headers = rows[0].map(normalize);
  if (LEGACY_HEADERS.every((header) => headers.includes(header))) return parseLegacy(rows, headers);
  return parseEvents(rows, headers);
}

export function applyLegacyStartDate(drafts: ImportedScheduleDraft[], startDate: string): ImportedScheduleDraft[] {
  const base = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(base.getTime())) throw new Error('Start date is invalid');
  return drafts.map((draft, index) => {
    const dayOffset = (draft.legacyDay ?? (Math.floor(index / 4) + 1)) - 1;
    const date = new Date(base);
    date.setDate(base.getDate() + dayOffset);
    return { ...draft, date: date.toISOString().slice(0, 10) };
  });
}

export function draftsToEvents(drafts: ImportedScheduleDraft[], prefix = Date.now().toString(36)) {
  return drafts.map((draft, index) => ({ ...draft, id: `${prefix}-${index + 1}`, date: draft.date!, completed: draft.status === 'Done' }));
}
