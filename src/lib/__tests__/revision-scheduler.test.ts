import { describe, it, expect } from 'vitest';
import { applyRating, isDue, getDaysDiff, backfillLegacyItems, INTERVALS } from '../revision-scheduler';

const day = (n: number) => {
  const d = new Date('2026-10-17T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

describe('applyRating', () => {
  it('good advances stage and uses ladder', () => {
    const r = applyRating({ stage: 0, dueDate: '2026-10-17' }, 'good', day(0));
    expect(r.stage).toBe(1);
    expect(r.dueDate).toBe('2026-10-18');
  });

  it('again resets stage to 0 and due tomorrow', () => {
    const r = applyRating({ stage: 3, dueDate: '2026-10-17' }, 'again', day(0));
    expect(r.stage).toBe(0);
    expect(getDaysDiff(r.dueDate, day(0))).toBe(1);
  });

  it('easy jumps two stages', () => {
    const r = applyRating({ stage: 0, dueDate: '2026-10-17' }, 'easy', day(0));
    expect(r.stage).toBe(2);
  });

  it('stage caps at MAX_STAGE', () => {
    const r = applyRating({ stage: 4, dueDate: '2026-10-17' }, 'good', day(0));
    expect(r.stage).toBe(4);
  });

  it('hard keeps stage and extends due', () => {
    const r = applyRating({ stage: 2, dueDate: '2026-10-17' }, 'hard', day(0));
    expect(r.stage).toBe(2);
    expect(getDaysDiff(r.dueDate, day(0))).toBeGreaterThanOrEqual(1);
    expect(getDaysDiff(r.dueDate, day(0))).toBeLessThanOrEqual(7);
  });

  it('sets lastReviewedAt', () => {
    const r = applyRating({ stage: 0, dueDate: '2026-10-17' }, 'good', day(0));
    expect(r.lastReviewedAt).toBeTruthy();
  });
});

describe('isDue', () => {
  it('due when dueDate is today or past', () => {
    expect(isDue({ dueDate: '2026-10-17' }, day(0))).toBe(true);
    expect(isDue({ dueDate: '2026-10-16' }, day(0))).toBe(true);
    expect(isDue({ dueDate: '2026-10-18' }, day(0))).toBe(false);
  });
});

describe('backfillLegacyItems', () => {
  it('pushes legacy completed items out and stamps lastReviewedAt', () => {
    const { items, changed } = backfillLegacyItems<{ id: string; stage: number; dueDate: string; completed: boolean; lastReviewedAt?: string | null }>(
      [{ id: 'a', stage: 0, dueDate: '2026-01-01', completed: true }],
      day(0),
    );
    expect(changed).toBe(true);
    expect(items[0].lastReviewedAt).toBeTruthy();
    expect(getDaysDiff(items[0].dueDate, day(0))).toBe(INTERVALS[0]);
  });

  it('is idempotent', () => {
    const once = backfillLegacyItems(
      [{ stage: 0, dueDate: '2026-01-01', completed: true }],
      day(0),
    );
    const twice = backfillLegacyItems(once.items, day(0));
    expect(twice.changed).toBe(false);
    expect(twice.items[0].dueDate).toBe(once.items[0].dueDate);
  });

  it('leaves incomplete items untouched', () => {
    const { items, changed } = backfillLegacyItems(
      [{ stage: 1, dueDate: '2026-01-01', completed: false }],
      day(0),
    );
    expect(changed).toBe(false);
    expect(items[0].dueDate).toBe('2026-01-01');
  });
});

describe('getDaysDiff', () => {
  it('negative for past dates', () => {
    expect(getDaysDiff('2026-10-16', day(0))).toBe(-1);
    expect(getDaysDiff('2026-10-17', day(0))).toBe(0);
    expect(getDaysDiff('2026-10-18', day(0))).toBe(1);
  });
});
