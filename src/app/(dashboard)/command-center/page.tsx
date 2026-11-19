'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LazyAppear } from "@/components/shared/LazyAppear";
import { useCommandCenterQuery, useUpdateFocusItem } from '@/hooks/use-command-center';
import { useProfile } from "@/components/providers/ProfileProvider";
import { useRevisionDueCount } from '@/hooks/use-revision-due';
import {
  Zap,
  TrendingUp,
  Calendar,
  BrainCircuit,
  ArrowRight,
  Loader2,
  Plus,
  Pencil,
} from "lucide-react";
import { cn, formatRelativeTime } from '@/lib/utils';

const statusStyles: Record<string, { label: string; className: string; bar: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800', bar: 'bg-emerald-500' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-950 text-blue-300 border-blue-800', bar: 'bg-blue-500' },
  MAINTAINING: { label: 'Maintaining', className: 'bg-amber-950 text-amber-300 border-amber-800', bar: 'bg-amber-500' },
  PLANNING: { label: 'Planning', className: 'bg-purple-950 text-purple-300 border-purple-800', bar: 'bg-purple-500' },
  ON_HOLD: { label: 'On Hold', className: 'bg-muted text-muted-foreground border-border', bar: 'bg-muted-foreground' },
};
import { ArrowRight, Flame, Loader2, RotateCcw } from 'lucide-react';
import { BoltLoader } from '@/components/shared/BoltLoader';
import { ActivityChart } from './activity-chart';
import { useCommandCenterQuery } from '@/hooks/use-command-center';
import { useRevisionsQuery } from '@/hooks/use-revision';
import { useProfile } from '@/components/providers/ProfileProvider';
import { getRoadmapLink, getTodaySchedule, SCHEDULES, SCHEDULE_IDS, type ScheduleId } from '@/data/schedules';
import { STORAGE_KEYS } from '@/lib/storage-keys';

const cardClass = 'rounded-xl border border-border bg-card p-5';

function parsePercent(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ProjectProgressBar({ progress }: { progress: string }) {
  const pct = parseInt(progress);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-muted-foreground'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{progress}</span>
    </div>
  );
function dueLabel(dueDate: string) {
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return { text: `Overdue ${Math.abs(diff)}d`, color: 'text-red-400' };
  if (diff === 0) return { text: 'Today', color: 'text-red-400' };
  if (diff === 1) return { text: 'Tomorrow', color: 'text-amber-400' };
  if (diff <= 7) return { text: `In ${diff}d`, color: 'text-zinc-400' };
  return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-zinc-500' };
}

export default function CommandCenterPage() {
  const { userName } = useProfile();
  const { data, isLoading, error } = useCommandCenterQuery();
  const updateFocusItem = useUpdateFocusItem();
  const dueCount = useRevisionDueCount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLabel, setDialogLabel] = useState('');
  const [dialogValue, setDialogValue] = useState('');
  const [dialogBadge, setDialogBadge] = useState('');

  useEffect(() => {
    localStorage.removeItem('samundar-command-center');
  }, []);

  const openFocusDialog = (label: string, value: string, badge: string) => {
    setDialogLabel(label);
    setDialogValue(value);
    setDialogBadge(badge);
    setDialogOpen(true);
  };

  const saveFocusEdit = async () => {
    if (!userEmail || !dialogLabel) {
      setDialogOpen(false);
      return;
    }
    updateFocusItem.mutate({ label: dialogLabel, value: dialogValue, badge: dialogBadge });
    setDialogOpen(false);
  };

  const todayActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (data?.activities ?? []).filter(a => new Date(a.createdAt) >= today);
  }, [data?.activities]);
  const revisionsQuery = useRevisionsQuery();
  const [scheduleId] = useState<ScheduleId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_SCHEDULE_MODE);
      if (saved && SCHEDULE_IDS.includes(saved as ScheduleId)) return saved as ScheduleId;
    } catch {}
    return 'steady';
  });

  const revisions = revisionsQuery.data?.data ?? [];
  const pendingRevisions = useMemo(
    () =>
      revisions
        .filter((item) => !item.completed)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [revisions],
  );
  const completedRevisions = revisions.length - pendingRevisions.length;

  const schedule = useMemo(() => getTodaySchedule(scheduleId), [scheduleId]);
  const scheduleLabel = SCHEDULES[scheduleId]?.shortLabel ?? '';

  const projects = data?.projects ?? [];
  const averageProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + parsePercent(project.progress), 0) / projects.length)
    : 0;

  const PREVIEW_LOADER = false
  if (PREVIEW_LOADER) {
    return <BoltLoader stage="Preview" label="Loader preview" />;
  }

  if (isLoading || !data?.metrics) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading command center...</p>
          </div>
        </div>
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  const metrics = data.metrics;
  const activitySeries = data.activitySeries ?? [];
  const revisionDuePct = revisions.length
    ? Math.round((pendingRevisions.length / revisions.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Problems Solved',
      value: String(metrics.solvedTotal),
      unit: 'total',
      sub: `${metrics.weekCount} this week · ${metrics.monthCount} this month`,
    },
    {
      label: 'Current Streak',
      value: String(metrics.streak),
      unit: metrics.streak === 1 ? 'day' : 'days',
      sub: 'Consecutive days with activity',
    },
    {
      label: 'Weekly Progress',
      value: `${metrics.weeklyPct}%`,
      unit: '',
      sub: `${metrics.weekCount} completions this week`,
      pct: metrics.weeklyPct,
    },
    {
      label: 'Revisions Due',
      value: String(metrics.dueCount),
      unit: metrics.dueCount === 1 ? 'card' : 'cards',
      sub: `${completedRevisions} completed of ${revisions.length} tracked`,
      pct: revisionDuePct,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {userName}! Let&apos;s build something great today.
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Command Center</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Welcome back{userName ? `, ${userName}` : ''}. Here is where you stand today.
          </p>
        </div>
        {error && (
          <span className="rounded-full border border-amber-800 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
            Offline — showing cached data
          </span>
        )}
      </header>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${cardClass} flex flex-col`}>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-tight">{stat.value}</span>
              {stat.unit && <span className="text-xs text-zinc-500">{stat.unit}</span>}
            </p>
            <p className="mt-1 text-xs text-zinc-400">{stat.sub}</p>
            {'pct' in stat && stat.pct !== undefined && (
              <div className="mt-auto pt-3">
                <div className="h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-[#E1DCC9]" style={{ width: `${stat.pct}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/revision?tab=due"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {dueCount > 0 ? `Due Revisions (${dueCount})` : 'All caught up'} <ArrowRight size={13} />
          </Link>
          <Link
            href="/daily"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-card transition-colors"
          >
            Today&apos;s Plan
          </Link>
        </div>

        <LazyAppear>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.stats.map((stat) => {
              const Icon = ICON_MAP[stat.label] || Zap;
              return (
                <Card key={stat.label} className="border-border bg-card/40">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.sub}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2.5">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Problem Activity</h2>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Last {activitySeries.length} days
            </p>
          </div>
          <div className="mt-4">
            <ActivityChart series={activitySeries} />
          </div>
        </div>

        <LazyAppear delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Today&apos;s Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.focusItems.map((item) => {
                  if (item.label === 'Due Revisions') {
                    return (
                      <Link
                        key={item.label}
                        href="/revision?tab=due"
                        className="flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            {item.label}
                            <ArrowRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-sm font-medium mt-0.5 group-hover:text-foreground transition-colors">{item.value}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground group-hover:bg-muted/70 transition-colors">
                          {item.badge}
                        </Badge>
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={item.label}
                      onClick={() => openFocusDialog(item.label, item.value, item.badge)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {item.label}
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-sm font-medium mt-0.5 group-hover:text-foreground transition-colors">{item.value}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground group-hover:bg-muted/70 transition-colors">
                        {item.badge}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Current Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.projects.length === 0 ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">No projects yet</p>
                    <button onClick={() => router.push('/projects')}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="h-3 w-3" /> Add projects in Hub
                    </button>
                  </div>
                ) : (
                  data.projects.map((project) => {
                    const style = statusStyles[project.status] || statusStyles.PLANNING;
                    return (
                      <div key={project.name}
                        onClick={() => router.push('/projects')}
                        className="rounded-lg border border-border/60 bg-card/20 p-3 space-y-2 hover:border-muted-foreground/40 hover:bg-card/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{project.name}</p>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', style.className)}>{style.label}</Badge>
                        </div>
                        <ProjectProgressBar progress={project.progress} />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </LazyAppear>

        <LazyAppear delay={0.2}>
          <Card className="border-border bg-card/40">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Link href="/history?tab=activity" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Show more</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayActivities.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
                    {todayActivities.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <p className="text-sm text-muted-foreground flex-1 truncate">{activity.text}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{formatRelativeTime(activity.createdAt)}</span>
                      </div>
                    ))}
                  </>
                )}
                {earlierActivities.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4">Earlier</p>
                    {earlierActivities.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted/60 shrink-0" />
                        <p className="text-sm text-muted-foreground flex-1 truncate">{activity.text}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{formatRelativeTime(activity.createdAt)}</span>
                      </div>
                    ))}
                  </>
                )}
                {data.activities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                )}
              </div>
              <Link href="/history" className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Show more <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </LazyAppear>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit {dialogLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Value</label>
              <Input value={dialogValue} onChange={(e) => setDialogValue(e.target.value)} className="bg-card border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Badge</label>
              <Input value={dialogBadge} onChange={(e) => setDialogBadge(e.target.value)} className="bg-card border-border text-foreground" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveFocusEdit}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Today&apos;s Schedule</h2>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {scheduleLabel}
            </p>
          </div>
          {schedule?.slots.length ? (
            <ul className="mt-4 space-y-1">
              {schedule.slots.map((slot) => {
                const href = getRoadmapLink(slot.topic, slot.period) ?? '/daily';
                return (
                  <li key={slot.period}>
                    <Link
                      href={href}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/60"
                    >
                      <Flame className="h-4 w-4 shrink-0 text-[#E1DCC9]" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{slot.topic}</span>
                        <span className="block truncate text-xs text-zinc-500">
                          {slot.period}
                          {slot.description ? ` · ${slot.description}` : ''}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No schedule set for today.</p>
          )}
          <Link
            href="/daily"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[#E1DCC9] transition-opacity hover:opacity-70"
          >
            Open daily planner
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Active Projects</h2>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {projects.length} tracked · {averageProjectProgress}% avg
            </p>
          </div>
          {projects.length ? (
            <ul className="mt-4 space-y-4">
              {projects.map((project) => {
                const pct = parsePercent(project.progress);
                return (
                  <li key={project.name}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-[11px] font-medium text-[#E1DCC9]">
                        {project.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{project.name}</span>
                        <span className="block truncate text-xs text-zinc-500">
                          {project.status.replaceAll('_', ' ').toLowerCase()}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-zinc-400">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-[#E1DCC9]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No active projects yet.</p>
          )}
          <Link
            href="/projects"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[#E1DCC9] transition-opacity hover:opacity-70"
          >
            Manage projects
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Revision Queue</h2>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#E1DCC9]">
              {pendingRevisions.length} due
            </p>
          </div>
          {pendingRevisions.length ? (
            <ul className="mt-4 space-y-3">
              {pendingRevisions.slice(0, 5).map((item) => {
                const due = dueLabel(item.dueDate);
                return (
                  <li key={item.id} className="flex items-center gap-2.5">
                    <RotateCcw className={`h-3.5 w-3.5 shrink-0 ${due.color}`} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm">{item.concept}</span>
                    <span className={`shrink-0 text-xs ${due.color}`}>{due.text}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Nothing due. Revision queue is clear.</p>
          )}
          <Link
            href="/revision"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[#E1DCC9] transition-opacity hover:opacity-70"
          >
            Open revision system
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
