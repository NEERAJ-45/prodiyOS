import { describe, expect, it } from 'vitest';
import { applyLegacyStartDate, draftsToEvents, parseScheduleCsv } from '../csv';

const legacy = '\uFEFFWeek,Day,Type,DSA Task,Spring Boot Task,System Design Task,Mastery Check (pass = Done),Status,Notes\n1,1,Study,"Two Pointers, basics",Auto config,"Indexes, WAL",Draw both,Pending,first';
const events = 'Date,Start Time,End Time,Category,Task,Status,Notes\n2026-12-02,07:00,08:30,DSA,"Two Pointers, basics",Pending,Focus';

describe('schedule CSV', () => {
  it('parses BOM and commas inside quoted fields', () => {
    const result = parseScheduleCsv(legacy);
    expect(result.errors).toEqual([]);
    expect(result.drafts).toHaveLength(4);
    expect(result.drafts[0].title).toContain('Two Pointers, basics');
  });
  it('maps legacy rows to four all-day events per plan day', () => {
    const parsed = parseScheduleCsv(legacy);
    const dated = applyLegacyStartDate(parsed.drafts, '2026-12-01');
    const result = draftsToEvents(dated, 'test');
    expect(result[0].date).toBe('2026-12-01');
    expect(result[3].date).toBe('2026-12-01');
    expect(result[4]).toBeUndefined();
  });
  it('parses explicit event dates and times', () => {
    const result = parseScheduleCsv(events);
    expect(result.errors).toEqual([]);
    expect(result.drafts[0]).toMatchObject({ date: '2026-12-02', startTime: '07:00', endTime: '08:30', allDay: false });
  });
});
