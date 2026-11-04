'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
