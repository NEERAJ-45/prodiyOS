'use client';

import { useState, useEffect, useMemo, useCallback, type ElementType } from 'react';
import { motion } from 'framer-motion';
import {
  Flame, BookOpen, Target, Activity,
  Loader2, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, CalendarDays, ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ROADMAPS } from '@/data/roadmaps';
import { useMounted } from '@/hooks/useMounted';
import { useAllCompletionsQuery } from '@/hooks/use-completions';
import { useSchedulePlansQuery } from '@/hooks/use-schedule-plans';
import { ActivityHeatmap } from '@/components/charts/activity-heatmap';
import { WeeklyActivityChart } from '@/components/charts/weekly-activity-chart';
import { CategoryProgressChart } from '@/components/charts/category-progress-chart';

const TOTAL_TOPICS = ROADMAPS.reduce((s, r) => s + r.total, 0);

const CATEGORY_COLORS: Record<string, string> = {
  Foundation: '#0ea5e9',
  'System Design': '#8b5cf6',
  Backend: '#f97316',
  Frontend: '#38bdf8',
  DevOps: '#3b82f6',
  Databases: '#10b981',
  Aptitude: '#14b8a6',
};

function computeStreak(dates: string[]): number {
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

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = display;
    const step = Math.max(1, Math.floor(Math.abs(value - current) / 20));
    const timer = setInterval(() => {
      if (current < value) {
        current = Math.min(current + step, value);
        setDisplay(current);
      } else {
        clearInterval(timer);
        setDisplay(value);
      }
    }, 30);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{display}{suffix}</>;
}

type StatInfo = {
  label: string; value: number; suffix: string; href: string; cta: string; blurb: string;
  icon: ElementType; color: string; bg: string;
};

type RoadmapStat = {
  title: string; storageKey: string; total: number; category: string; color: string;
  completed: number; pct: number; [key: string]: unknown;
};

function GroupedRoadmapTable({ roadmapStats, totalCompleted, overallPct }: {
  roadmapStats: RoadmapStat[]; totalCompleted: number; overallPct: number;
}) {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const toggle = useCallback((cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, RoadmapStat[]>();
    roadmapStats.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    });
    return Array.from(map.entries()).map(([cat, items]) => {
      const done = items.reduce((s, r) => s + r.completed, 0);
      const tot = items.reduce((s, r) => s + r.total, 0);
      return { cat, items, done, tot, pct: Math.round((done / tot) * 100) };
    });
  }, [roadmapStats]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid grid-cols-[1fr_80px_80px_160px_52px] gap-2 px-5 py-2 border-b border-zinc-800 text-[11px] font-medium text-zinc-500">
          <span>Category / Roadmap</span>
          <span className="text-right">Done</span>
          <span className="text-right">Total</span>
          <span>Progress</span>
          <span className="text-right">%</span>
        </div>
        {grouped.map(({ cat, items, done, tot, pct }, gi) => {
          const open = openCats.has(cat);
          const catColor = CATEGORY_COLORS[cat] || '#6366f1';
          return (
            <div key={cat} className={cn(gi < grouped.length - 1 && 'border-b border-zinc-800/70')}>
              <button onClick={() => toggle(cat)}
                className="w-full grid grid-cols-[1fr_80px_80px_160px_52px] gap-2 items-center px-5 py-3 hover:bg-zinc-800/40 transition-colors text-left">
                <span className="flex items-center gap-2 font-medium text-zinc-200">
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${catColor}18`, color: catColor }}>{cat}</span>
                </span>
                <span className="text-right text-sm font-semibold text-zinc-200 tabular-nums">{done}</span>
                <span className="text-right text-sm text-zinc-500 tabular-nums">{tot}</span>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: catColor }} />
                </div>
                <span className="text-right text-sm font-semibold tabular-nums" style={{ color: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#52525b' }}>{pct}%</span>
              </button>
              {open && (
                <div className="border-t border-zinc-800/50 bg-zinc-950/30">
                  {items.map((r, ri) => (
                    <div key={r.title} className={cn('grid grid-cols-[1fr_80px_80px_160px_52px] gap-2 items-center pl-10 pr-5 py-2 text-sm', ri < items.length - 1 && 'border-b border-zinc-800/40', 'hover:bg-zinc-800/20 transition-colors')}>
                      <span className="flex items-center gap-2 text-zinc-400">
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                        {r.title}
                      </span>
                      <span className="text-right text-zinc-300 tabular-nums">{r.completed}</span>
                      <span className="text-right text-zinc-600 tabular-nums">{r.total}</span>
                      <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                      </div>
                      <span className="text-right text-xs font-medium tabular-nums" style={{ color: r.pct >= 80 ? '#10b981' : r.pct >= 40 ? '#f59e0b' : '#52525b' }}>{r.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="grid grid-cols-[1fr_80px_80px_160px_52px] gap-2 items-center px-5 py-3 border-t border-zinc-700 bg-zinc-800/30">
          <span className="font-semibold text-zinc-200 text-sm">Total</span>
          <span className="text-right font-bold text-zinc-100 tabular-nums text-sm">{totalCompleted}</span>
          <span className="text-right text-zinc-400 tabular-nums text-sm">{TOTAL_TOPICS}</span>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-right font-bold text-indigo-400 tabular-nums text-sm">{overallPct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [activeStat, setActiveStat] = useState<StatInfo | null>(null);
  const [completionMap, setCompletionMap] = useState<Record<string, Set<string>>>({});
  const [localDates, setLocalDates] = useState<string[]>([]);
  const [dbDates, setDbDates] = useState<string[]>([]);
  const mounted = useMounted();
  const { data: completionsDb, isLoading: completionsLoading } = useAllCompletionsQuery();
  const { data: plansData, isLoading: plansLoading } = useSchedulePlansQuery();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localMap: Record<string, Set<string>> = {};
    const localFound: string[] = [];
    ROADMAPS.forEach((rm) => {
      const raw = localStorage.getItem(rm.storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Record<string, string>;
          localMap[rm.storageKey] = new Set(Object.keys(parsed));
          Object.values(parsed).forEach((d) => { if (d) localFound.push(d); });
        } catch { }
      }
      if (!localMap[rm.storageKey]) localMap[rm.storageKey] = new Set();
    });
    setCompletionMap({ ...localMap });
    setLocalDates(localFound);
  }, []);

  useEffect(() => {
    if (!completionsDb?.dbConnected || !Array.isArray(completionsDb.data)) return;
    const merged: Record<string, Set<string>> = {};
    ROADMAPS.forEach((rm) => { merged[rm.storageKey] = new Set(); });
    const dbDates: string[] = [];
    completionsDb.data.forEach(({ storagePrefix, itemId, completedAt }) => {
      if (!merged[storagePrefix]) merged[storagePrefix] = new Set();
      if (itemId) merged[storagePrefix].add(itemId);
      if (completedAt) dbDates.push(completedAt);
    });
    setCompletionMap((prev) => {
      const out: Record<string, Set<string>> = {};
      new Set([...Object.keys(prev), ...Object.keys(merged)]).forEach((key) => {
        out[key] = new Set([...(prev[key] ?? []), ...(merged[key] ?? [])]);
      });
      return out;
    });
    setDbDates(dbDates);
  }, [completionsDb]);

  const loading = completionsLoading || plansLoading;

  const allEvents = useMemo(
    () => (plansData?.plans ?? []).flatMap((plan) => plan.events.map((event) => ({ ...event, planName: plan.name, scheduleId: plan.scheduleId }))),
    [plansData],
  );
  const todayKey = new Date().toISOString().slice(0, 10);

  const calendarStats = useMemo(() => {
    const done = allEvents.filter((e) => e.completed).length;
    const overdue = allEvents.filter((e) => !e.completed && e.date < todayKey).length;
    const dueToday = allEvents.filter((e) => e.date === todayKey).length;
    const doneToday = allEvents.filter((e) => e.date === todayKey && e.completed).length;
    const byPlan = (plansData?.plans ?? []).map((plan) => {
      const total = plan.events.length;
      const completed = plan.events.filter((e) => e.completed).length;
      return { name: plan.name, total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
    }).filter((p) => p.total > 0);
    return {
      done, total: allEvents.length, overdue, dueToday, doneToday, byPlan,
      pct: allEvents.length ? Math.round((done / allEvents.length) * 100) : 0,
    };
  }, [allEvents, plansData, todayKey]);

  const calendarDates = useMemo(
    () => allEvents.filter((e) => e.completed).map((e) => e.date),
    [allEvents],
  );
  const completionDates = useMemo(
    () => [...localDates, ...dbDates, ...calendarDates],
    [localDates, dbDates, calendarDates],
  );

  const roadmapStats = useMemo(() =>
    ROADMAPS.map((rm) => {
      const completed = completionMap[rm.storageKey]?.size ?? 0;
      return { ...rm, completed, pct: Math.round((completed / rm.total) * 100) };
    }), [completionMap]);

  const totalCompleted = useMemo(() => roadmapStats.reduce((s, r) => s + r.completed, 0), [roadmapStats]);
  const overallPct = Math.round((totalCompleted / TOTAL_TOPICS) * 100);
  const streak = useMemo(() => computeStreak(completionDates), [completionDates]);
  const activeDays = useMemo(() => new Set(completionDates.map((d) => d.split('T')[0])).size, [completionDates]);

  const categoryStats = useMemo(() => {
    const cats: Record<string, { completed: number; total: number }> = {};
    roadmapStats.forEach((r) => {
      if (!cats[r.category]) cats[r.category] = { completed: 0, total: 0 };
      cats[r.category].completed += r.completed;
      cats[r.category].total += r.total;
    });
    return Object.entries(cats).map(([cat, val]) => ({
      label: cat, completed: val.completed, total: val.total,
      pct: Math.round((val.completed / val.total) * 100),
      color: CATEGORY_COLORS[cat] || '#6366f1',
    })).sort((a, b) => b.pct - a.pct);
  }, [roadmapStats]);

  const weakAreas = useMemo(() => [...roadmapStats].sort((a, b) => a.pct - b.pct).slice(0, 5), [roadmapStats]);
  const strongAreas = useMemo(() => [...roadmapStats].filter((r) => r.completed > 0).sort((a, b) => b.pct - a.pct).slice(0, 5), [roadmapStats]);

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">

            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {loading ? 'Loading...' : `${totalCompleted} of ${TOTAL_TOPICS} topics completed (${overallPct}%)`}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── KPI Row ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {([
                { label: 'Topics Done', value: totalCompleted, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', suffix: `/${TOTAL_TOPICS}`, href: '/roadmaps', cta: 'Open roadmaps', blurb: 'Topics you have ticked off across every roadmap. Jump in and keep the streak of completions going.' },
                { label: 'Current Streak', value: streak, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10', suffix: ` day${streak !== 1 ? 's' : ''}`, href: '/daily', cta: "Open today's plan", blurb: 'Consecutive days with at least one completion, counting roadmap topics and finished calendar events.' },
                { label: 'Active Days', value: activeDays, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', suffix: '', href: '/daily', cta: "Open today's plan", blurb: 'Every distinct day that has any completion on record. Keep the calendar moving to grow this number.' },
                { label: 'Completion Rate', value: overallPct, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', suffix: '%', href: '/mastery', cta: 'Review mastery', blurb: 'Share of all roadmap topics you have completed so far, weighted across every roadmap.' },
                { label: 'Calendar Done', value: calendarStats.done, icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-500/10', suffix: `/${calendarStats.total}`, href: '/plan/calendar', cta: 'Open calendar tasks', blurb: `${calendarStats.doneToday} of ${calendarStats.dueToday} events scheduled today are done. The calendar holds every planned task.` },
                { label: 'Overdue Plans', value: calendarStats.overdue, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', suffix: calendarStats.overdue === 1 ? ' event' : ' events', href: '/plan/calendar', cta: 'Review overdue tasks', blurb: 'Events whose date has passed but are still not marked done. Clear them or reschedule them in the calendar.' },
              ] as StatInfo[]).map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                  >
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveStat(stat)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveStat(stat); } }}
                      className="group cursor-pointer bg-card/50 border-zinc-800 hover:border-sky-500/40 hover:bg-zinc-800/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <CardContent className="relative p-5 flex items-center gap-4">
                        <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-zinc-600 opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', stat.bg)}>
                          <Icon className={cn('h-5 w-5', stat.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-bold text-foreground truncate">
                            {loading ? '...' : <AnimatedNumber value={stat.value} />}
                            <span className="text-sm font-normal text-muted-foreground ml-0.5">{stat.suffix}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* ── Contribution Heatmap ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-400" />
                    <CardTitle className="text-sm font-medium">Activity Calendar</CardTitle>
                    <span className="ml-auto text-[11px] text-muted-foreground">Last 7 weeks</span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                  ) : (
                    <ActivityHeatmap dates={completionDates} />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Weekly Activity + Category Progress ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <Card className="bg-card/50 border-zinc-800 h-full">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    {loading ? (
                      <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                    ) : (
                      <WeeklyActivityChart dates={completionDates} />
                    )}
                    <p className="text-[10px] text-zinc-500 mt-3 text-center">Completions per week (last 8 weeks)</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-card/50 border-zinc-800 h-full">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-400" />
                      <CardTitle className="text-sm font-medium">Category Progress</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    {loading ? (
                      <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                    ) : (
                      <CategoryProgressChart categories={categoryStats} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── Calendar Plan Progress ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-sky-400" />
                    <CardTitle className="text-sm font-medium">Calendar Plan Progress</CardTitle>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {calendarStats.doneToday}/{calendarStats.dueToday} today · {calendarStats.pct}% overall
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  {calendarStats.byPlan.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">
                      No calendar plans yet — import one from the calendar.
                    </p>
                  ) : calendarStats.byPlan.map((plan) => (
                    <div key={plan.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 truncate mr-2">{plan.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-zinc-500 tabular-nums">{plan.completed}/{plan.total}</span>
                          <span className="w-8 text-right font-medium tabular-nums text-sky-400">{plan.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500 transition-all duration-700" style={{ width: `${plan.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Weak & Strong Areas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="bg-card/50 border-zinc-800">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                      <span className="ml-auto text-[11px] text-muted-foreground">Bottom 5</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {weakAreas.map((area) => (
                      <div key={area.title} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 truncate mr-2">{area.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-zinc-500">{area.completed}/{area.total}</span>
                            <span className="w-8 text-right font-medium tabular-nums" style={{ color: area.pct >= 40 ? '#f59e0b' : '#6c6c6c' }}>{area.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${area.pct}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-card/50 border-zinc-800">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <CardTitle className="text-sm font-medium">Strongest Areas</CardTitle>
                      <span className="ml-auto text-[11px] text-muted-foreground">Top 5</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {strongAreas.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No completions yet — start a roadmap!</p>
                    ) : strongAreas.map((area) => (
                      <div key={area.title} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 truncate mr-2">{area.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-zinc-500">{area.completed}/{area.total}</span>
                            <span className="w-8 text-right font-medium tabular-nums text-emerald-400">{area.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${area.pct}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── Roadmap Table ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-zinc-400" />
                    <CardTitle className="text-sm font-medium">All Roadmaps</CardTitle>
                    <span className="ml-auto text-[11px] text-muted-foreground">Click a category to expand</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <GroupedRoadmapTable roadmapStats={roadmapStats} totalCompleted={totalCompleted} overallPct={overallPct} />
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>

      <Dialog open={!!activeStat} onOpenChange={(open) => { if (!open) setActiveStat(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeStat && <activeStat.icon className={cn('h-4 w-4', activeStat.color)} />}
              {activeStat?.label}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {activeStat?.blurb}
            </DialogDescription>
          </DialogHeader>
          {activeStat && (
            <p className="text-sm text-foreground">
              <span className="font-semibold tabular-nums">{activeStat.value}{activeStat.suffix}</span>
              <span className="text-muted-foreground"> recorded so far</span>
            </p>
          )}
          <DialogFooter>
            <Button asChild className="group/cta w-full sm:w-auto">
              <Link href={activeStat?.href ?? '/'} onClick={() => setActiveStat(null)}>
                {activeStat?.cta}
                <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
