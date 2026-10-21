export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const INTERVALS = [1, 3, 7, 21, 60] as const;
export const MAX_STAGE = 4;

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Calendar-day difference: dueDate - today. Negative = overdue. */
export function getDaysDiff(dateStr: string, today: Date = new Date()): number {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

export function isDue(
  item: { dueDate: string; lastReviewedAt?: string | null },
  today: Date = new Date(),
): boolean {
  return getDaysDiff(item.dueDate, today) <= 0;
}

function clampStage(n: number): number {
  return Math.max(0, Math.min(n, MAX_STAGE));
}

/**
 * Apply a review rating and compute the next stage/dueDate.
 * today is injectable for deterministic tests.
 */
export function applyRating(
  item: { stage: number; dueDate: string },
  rating: Rating,
  today: Date = new Date(),
): { stage: number; dueDate: string; lastReviewedAt: string } {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const lastReviewedAt = new Date().toISOString();

  let stage: number;
  let days: number;

  switch (rating) {
    case 'again':
      stage = 0;
      days = 1;
      break;
    case 'hard': {
      stage = item.stage;
      const currentSpan = Math.max(1, getDaysDiff(item.dueDate, t));
      days = Math.min(currentSpan + 1, 7);
      break;
    }
    case 'good': {
      days = INTERVALS[Math.min(item.stage, INTERVALS.length - 1)];
      stage = clampStage(item.stage + 1);
      break;
    }
    case 'easy': {
      days = Math.ceil(INTERVALS[Math.min(item.stage, INTERVALS.length - 1)] * 1.5);
      stage = clampStage(item.stage + 2);
      break;
    }
  }

  return {
    stage,
    dueDate: formatDate(addDays(t, days)),
    lastReviewedAt,
  };
}

/**
 * Quiet backfill: legacy items that were checked off (completed: true)
 * without lastReviewedAt get a review stamp and their dueDate pushed out
 * so they don't flood the Due list on upgrade. Idempotent.
 */
export function backfillLegacyItems<
  T extends {
    stage: number;
    dueDate: string;
    completed?: boolean;
    lastReviewedAt?: string | null;
  },
>(items: T[], today: Date = new Date()): { items: T[]; changed: boolean } {
  let changed = false;
  const next = items.map((item) => {
    if (item.completed === true && !item.lastReviewedAt) {
      changed = true;
      const t = new Date(today);
      t.setHours(0, 0, 0, 0);
      const days = INTERVALS[Math.min(clampStage(item.stage), INTERVALS.length - 1)];
      return {
        ...item,
        lastReviewedAt: new Date().toISOString(),
        dueDate: formatDate(addDays(t, days)),
      };
    }
    return item;
  });
  return { items: next, changed };
}
