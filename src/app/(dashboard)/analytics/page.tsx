'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, BookOpen, Target, Activity,
  Loader2, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ROADMAPS } from '@/data/roadmaps';
import { useMounted } from '@/hooks/useMounted';
import { useProfile } from '@/components/providers/ProfileProvider';

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

const HEATMAP_COLORS = ['#1a1a2e', '#0f3b5e', '#1a6b4a', '#2ecc71', '#27ae60'];

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

function ContributionHeatmap({ dates }: { dates: string[] }) {
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dates.forEach((d) => {
      const key = d.split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [dates]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setDate(start.getDate() - 6 * 7 - 6);
    start.setHours(0, 0, 0, 0);

    const cells: { date: string; count: number; day: number }[] = [];
    const cur = new Date(start);
    while (cur <= today) {
      const key = cur.toISOString().split('T')[0];
      cells.push({ date: key, count: dayCounts[key] || 0, day: cur.getDay() });
      cur.setDate(cur.getDate() + 1);
    }

    const w: { days: typeof cells }[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push({ days: cells.slice(i, i + 7) });
    }

    const labels: { label: string; index: number }[] = [];
    w.forEach((week, wi) => {
      const firstDate = new Date(week.days[0]?.date || '');
      const month = firstDate.toLocaleString('default', { month: 'short' });
      if (wi === 0 || labels[labels.length - 1]?.label !== month) {
        labels.push({ label: month, index: wi });
      }
    });

    return { weeks: w, monthLabels: labels };
  }, [dayCounts]);

  const maxCount = Math.max(...Object.values(dayCounts), 1);

  const colorForCount = (count: number) => {
    if (count === 0) return HEATMAP_COLORS[0];
    const ratio = count / maxCount;
    if (ratio < 0.25) return HEATMAP_COLORS[1];
    if (ratio < 0.5) return HEATMAP_COLORS[2];
    if (ratio < 0.75) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  };

  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex text-[10px] text-zinc-500 mb-1" style={{ paddingLeft: 32 }}>
          {monthLabels.map((m) => (
            <div key={m.label} style={{ marginLeft: m.index * 14 }}>{m.label}</div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] pr-1.5 pt-0.5">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[10px] text-[9px] text-zinc-500 leading-[10px]">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const cell = week.days[dayIdx];
                if (!cell) return <div key={dayIdx} className="h-[10px] w-[10px]" />;
                return (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-[10px] w-[10px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-zinc-400"
                        style={{ backgroundColor: colorForCount(cell.count) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs px-2 py-1">
                      {cell.count} completion{cell.count !== 1 ? 's' : ''} on {cell.date}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 justify-end text-[10px] text-zinc-500">
          <span>Less</span>
          {HEATMAP_COLORS.map((c) => (
            <div key={c} className="h-[10px] w-[10px] rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
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
  const { userEmail, customDbUrl } = useProfile();
  const [completionMap, setCompletionMap] = useState<Record<string, Set<string>>>({});
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useMounted();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localMap: Record<string, Set<string>> = {};
    const localDates: string[] = [];
    ROADMAPS.forEach((rm) => {
      const raw = localStorage.getItem(rm.storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Record<string, string>;
          localMap[rm.storageKey] = new Set(Object.keys(parsed));
          Object.values(parsed).forEach((d) => { if (d) localDates.push(d); });
        } catch { }
      }
      if (!localMap[rm.storageKey]) localMap[rm.storageKey] = new Set();
    });
    setCompletionMap({ ...localMap });
    setCompletionDates([...localDates]);

    async function loadFromDB() {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-user-email': userEmail };
        if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
        const res = await fetch(`/api/db/completions?userEmail=${encodeURIComponent(userEmail)}`, { headers });
        const json = await res.json();
        if (json.dbConnected && Array.isArray(json.data)) {
          const merged: Record<string, Set<string>> = {};
          ROADMAPS.forEach((rm) => { merged[rm.storageKey] = new Set(localMap[rm.storageKey] || []); });
          const dbDates: string[] = [];
          json.data.forEach((item: { storagePrefix: string; itemId: string; completedAt: string }) => {
            const { storagePrefix, itemId, completedAt } = item;
            if (!merged[storagePrefix]) merged[storagePrefix] = new Set();
            if (itemId) merged[storagePrefix].add(itemId);
            if (completedAt) dbDates.push(completedAt);
          });
          setCompletionMap({ ...merged });
          setCompletionDates([...localDates, ...dbDates]);
        }
      } catch { /* fallback to local */ } finally {
        setLoading(false);
      }
    }
    loadFromDB();
  }, [userEmail, customDbUrl]);

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

  const weeklyActivity = useMemo(() => {
    const now = new Date(); now.setHours(23, 59, 59, 999);
    return Array.from({ length: 8 }, (_, i) => {
      const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - i * 7);
      const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
      const count = completionDates.filter((d) => {
        const t = new Date(d).getTime();
        return t >= weekStart.getTime() && t <= weekEnd.getTime();
      }).length;
      return { label: `W${8 - i}`, value: count, color: '#6366f1' };
    }).reverse();
  }, [completionDates]);

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
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Topics Done', value: totalCompleted, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', suffix: `/${TOTAL_TOPICS}` },
                { label: 'Current Streak', value: streak, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10', suffix: ` day${streak !== 1 ? 's' : ''}` },
                { label: 'Active Days', value: activeDays, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', suffix: '' },
                { label: 'Completion Rate', value: overallPct, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', suffix: '%' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                  >
                    <Card className="bg-card/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                      <CardContent className="p-5 flex items-center gap-4">
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
                    <ContributionHeatmap dates={completionDates} />
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
                      <div className="flex items-end gap-1.5 h-40 w-full">
                        {weeklyActivity.map((d, i) => {
                          const max = Math.max(...weeklyActivity.map((w) => w.value), 1);
                          const h = (d.value / max) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0 h-full justify-end">
                              <AnimatePresence>
                                {d.value > 0 && (
                                  <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[9px] font-medium text-zinc-400"
                                  >
                                    {d.value}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(h, d.value > 0 ? 4 : 2)}%` }}
                                transition={{ duration: 0.5, delay: i * 0.03 }}
                                className="w-full rounded-t bg-indigo-500 min-h-[2px]"
                                style={{ opacity: d.value > 0 ? 1 : 0.15 }}
                              />
                              <span className="text-[9px] text-zinc-600 truncate w-full text-center leading-none">{d.label}</span>
                            </div>
                          );
                        })}
                      </div>
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
                  <CardContent className="p-5 pt-0 space-y-3">
                    {loading ? (
                      <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                    ) : (
                      categoryStats.map((cat, i) => (
                        <motion.div
                          key={cat.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.04 }}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-zinc-300">{cat.label}</span>
                            </div>
                            <span className="text-zinc-500">
                              {cat.completed}/{cat.total}
                              <span className="ml-1.5 font-semibold" style={{ color: cat.color }}>{cat.pct}%</span>
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.pct}%` }}
                              transition={{ duration: 0.8, delay: 0.4 + i * 0.04 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

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
                            <span className="w-8 text-right font-medium tabular-nums" style={{ color: area.pct >= 40 ? '#f59e0b' : '#71717a' }}>{area.pct}%</span>
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
    </TooltipProvider>
  );
}
