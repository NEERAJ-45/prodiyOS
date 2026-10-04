import { ROADMAPS } from '@/data/roadmaps';

export const TOTAL_TOPICS = ROADMAPS.reduce((s, r) => s + r.total, 0);

export const CATEGORY_COLORS: Record<string, string> = {
  Foundation: '#0ea5e9',
  'System Design': '#8b5cf6',
  Backend: '#f97316',
  Frontend: '#38bdf8',
  DevOps: '#3b82f6',
  Databases: '#10b981',
  Aptitude: '#14b8a6',
};

export type RoadmapStat = {
  title: string; storageKey: string; total: number; category: string; color: string;
  completed: number; pct: number; [key: string]: unknown;
};

export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const daySet = new Set(dates.map((d) => d.split('T')[0]));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const yesterStr = yest.toISOString().split('T')[0];
  if (!daySet.has(todayStr) && !daySet.has(yesterStr)) return 0;
  let streak = 0;
  const cur = new Date(daySet.has(todayStr) ? today : yest);
  while (daySet.has(cur.toISOString().split('T')[0])) { streak++; cur.setDate(cur.getDate() - 1); }
  return streak;
}
