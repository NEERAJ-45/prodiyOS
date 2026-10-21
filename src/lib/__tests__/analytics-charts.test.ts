import { describe, expect, it } from 'vitest';
import { buildHeatmap, buildWeeklyActivity } from '@/lib/analytics-charts';

const atNoon = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 12).toISOString();

const TODAY = new Date(2026, 9, 21, 12);

describe('buildHeatmap', () => {
  it('builds a 7x7 calendar ending on the current week', () => {
    const { cells, weekLabels } = buildHeatmap([], TODAY);

    expect(cells).toHaveLength(49);
    expect(weekLabels).toHaveLength(7);
    expect(cells[0]).toMatchObject({ date: '2026-09-06', week: 0, day: 0 });
    expect(cells[48]).toMatchObject({ date: '2026-10-24', week: 6, day: 6 });
  });

  it('counts completions per local day and buckets them by relative volume', () => {
    const dates = [
      atNoon(2026, 10, 21),
      atNoon(2026, 10, 21),
      atNoon(2026, 10, 20),
      atNoon(2026, 9, 6),
    ];

    const { cells, maxCount } = buildHeatmap(dates, TODAY);
    const byDate = new Map(cells.map((cell) => [cell.date, cell]));

    expect(maxCount).toBe(2);
    expect(byDate.get('2026-10-21')).toMatchObject({ count: 2, bucket: '4' });
    expect(byDate.get('2026-10-20')).toMatchObject({ count: 1, bucket: '3' });
    expect(byDate.get('2026-09-06')).toMatchObject({ count: 1, bucket: '3' });
    expect(byDate.get('2026-10-19')).toMatchObject({ count: 0, bucket: '0' });
  });

  it('flags days after today and ignores completions outside the window', () => {
    const dates = [
      atNoon(2026, 9, 5),
      atNoon(2026, 10, 23),
    ];

    const { cells } = buildHeatmap(dates, TODAY);
    const byDate = new Map(cells.map((cell) => [cell.date, cell]));

    expect(byDate.get('2026-10-21')).toMatchObject({ future: false });
    expect(byDate.get('2026-10-22')).toMatchObject({ future: true, count: 0 });
    expect(byDate.get('2026-09-05')).toBeUndefined();
    expect(byDate.get('2026-10-23')).toMatchObject({ future: true });
  });
});

describe('buildWeeklyActivity', () => {
  it('returns eight chronological buckets ending with the current week', () => {
    const dates = [
      atNoon(2026, 8, 30),
      atNoon(2026, 9, 5),
      atNoon(2026, 10, 18),
      atNoon(2026, 10, 21),
      atNoon(2026, 10, 24),
    ];

    const weeks = buildWeeklyActivity(dates, TODAY);

    expect(weeks).toHaveLength(8);
    expect(weeks.map((week) => week.value)).toEqual([2, 0, 0, 0, 0, 0, 0, 3]);
    expect(weeks[0].label).toBe('Aug 30');
    expect(weeks[7].label).toBe('Oct 18');
  });

  it('ignores invalid dates and dates outside the eight week window', () => {
    const dates = ['not-a-date', atNoon(2026, 8, 29), atNoon(2026, 10, 25)];

    const weeks = buildWeeklyActivity(dates, TODAY);

    expect(weeks.map((week) => week.value)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
