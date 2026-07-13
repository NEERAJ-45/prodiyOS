import { describe, it, expect } from 'vitest';
import {
  SCHEDULES,
  SCHEDULE_IDS,
  getDaySchedule,
  getScheduleDays,
} from '@/data/schedules';

describe('schedules', () => {
  it('has all schedules', () => {
    expect(SCHEDULE_IDS).toEqual(['steady', 'react', 'java', 'devops', 'custom']);
  });

  it('each schedule has 7 days', () => {
    for (const id of SCHEDULE_IDS) {
      expect(SCHEDULES[id].days).toHaveLength(7);
    }
  });

  it('each day has 3 slots (M1, M2, Night)', () => {
    for (const id of SCHEDULE_IDS) {
      for (const day of SCHEDULES[id].days) {
        expect(day.slots).toHaveLength(3);
        expect(day.slots[0].period).toBe('M1 – DSA');
        expect(day.slots[2].period).toBe('Night – CS Fundamentals');
      }
    }
  });

  it('M1 is always DSA across all schedules', () => {
    for (const id of SCHEDULE_IDS) {
      for (const day of SCHEDULES[id].days) {
        expect(day.slots[0].topic).toContain('DSA');
      }
    }
  });

  it('getDaySchedule returns the right day', () => {
    const mon = getDaySchedule('steady', 'Mon');
    expect(mon).not.toBeNull();
    expect(mon!.day).toBe('Mon');
    expect(mon!.slots[1].topic).toBe('Spring');
  });

  it('getDaySchedule returns null for unknown day', () => {
    expect(getDaySchedule('steady', 'Funday')).toBeNull();
  });

  it('getScheduleDays returns all days', () => {
    expect(getScheduleDays('react')).toHaveLength(7);
    expect(getScheduleDays('react')[0].day).toBe('Mon');
  });

  it('steady schedule has correct M2 rotation', () => {
    const days = getScheduleDays('steady');
    expect(days[0].slots[1].topic).toBe('Spring');     // Mon
    expect(days[1].slots[1].topic).toContain('React');   // Tue
    expect(days[4].slots[1].topic).toBe('System Design'); // Fri
  });

  it('react schedule has React in all M2 slots', () => {
    for (const day of getScheduleDays('react')) {
      expect(day.slots[1].topic).toContain('React');
    }
  });

  it('java schedule has Spring in most M2 slots', () => {
    for (const day of getScheduleDays('java')) {
      // Fri is Java core, Sat is Spring mini CRUD — both fine
      expect(day.slots[1].topic).toMatch(/Spring|Java/);
    }
  });
});
