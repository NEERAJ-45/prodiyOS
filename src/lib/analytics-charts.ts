export type HeatmapBucket = '0' | '1' | '2' | '3' | '4';

export type HeatmapCell = {
  date: string;
  week: number;
  day: number;
  count: number;
  bucket: HeatmapBucket;
  future: boolean;
};

export type HeatmapData = {
  cells: HeatmapCell[];
  weekLabels: string[];
  dayLabels: string[];
  maxCount: number;
};

export type WeeklyActivityPoint = {
  label: string;
  value: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HEATMAP_WEEKS = 7;
const WEEKLY_BUCKETS = 8;

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDayKey(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : localDayKey(parsed);
}

function formatShort(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function bucketFor(count: number, maxCount: number): HeatmapBucket {
  if (count <= 0) return '0';
  const ratio = count / maxCount;
  if (ratio < 0.25) return '1';
  if (ratio < 0.5) return '2';
  if (ratio < 0.75) return '3';
  return '4';
}

export function buildHeatmap(dates: string[], today: Date): HeatmapData {
  const counts = new Map<string, number>();
  dates.forEach((value) => {
    const key = parseDayKey(value);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const start = addDays(startOfWeek(today), -(HEATMAP_WEEKS - 1) * 7);

  const weekLabels: string[] = [];
  const cells: HeatmapCell[] = [];
  let maxCount = 1;

  for (let week = 0; week < HEATMAP_WEEKS; week++) {
    const weekStart = addDays(start, week * 7);
    weekLabels.push(formatShort(weekStart));

    for (let day = 0; day < 7; day++) {
      const current = addDays(weekStart, day);
      const date = localDayKey(current);
      const future = current.getTime() > endOfToday.getTime();
      const count = future ? 0 : counts.get(date) ?? 0;
      maxCount = Math.max(maxCount, count);
      cells.push({ date, week, day, count, bucket: '0', future });
    }
  }

  return {
    cells: cells.map((cell) => ({ ...cell, bucket: bucketFor(cell.count, maxCount) })),
    weekLabels,
    dayLabels: DAY_LABELS,
    maxCount,
  };
}

export function buildWeeklyActivity(dates: string[], today: Date): WeeklyActivityPoint[] {
  const timestamps = dates
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));

  const currentWeekStart = startOfWeek(today);
  const points: WeeklyActivityPoint[] = [];

  for (let offset = WEEKLY_BUCKETS - 1; offset >= 0; offset--) {
    const weekStart = addDays(currentWeekStart, -offset * 7);
    const weekEnd = addDays(weekStart, 7).getTime();
    const startTime = weekStart.getTime();
    const value = timestamps.filter((time) => time >= startTime && time < weekEnd).length;
    points.push({ label: formatShort(weekStart), value });
  }

  return points;
}
