'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyAppear } from "@/components/shared/LazyAppear";
import { useCommandCenterQuery } from '@/hooks/use-command-center';
import { useSchedulePlansQuery, useUpdateScheduleEvent } from '@/hooks/use-schedule-plans';
import { dateKey } from '@/lib/schedule-plans/date-mapping';
import { useProfile } from "@/components/providers/ProfileProvider";
import { useRevisionDueCount } from '@/hooks/use-revision-due';
import {
  Zap,
  TrendingUp,
  Calendar,
  BrainCircuit,
  ArrowRight,
  Check,
  Loader2,
  Plus,
} from "lucide-react";
import { cn, formatRelativeTime } from '@/lib/utils';

const statusStyles: Record<string, { label: string; className: string; bar: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800', bar: 'bg-emerald-500' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-950 text-blue-300 border-blue-800', bar: 'bg-blue-500' },
  MAINTAINING: { label: 'Maintaining', className: 'bg-amber-950 text-amber-300 border-amber-800', bar: 'bg-amber-500' },
  PLANNING: { label: 'Planning', className: 'bg-purple-950 text-purple-300 border-purple-800', bar: 'bg-purple-500' },
  ON_HOLD: { label: 'On Hold', className: 'bg-muted text-muted-foreground border-border', bar: 'bg-muted-foreground' },
};

const ICON_MAP: Record<string, React.ElementType> = {
  'Current Streak': Zap,
  'Weekly Progress': TrendingUp,
  'Monthly Progress': Calendar,
  'Interview Readiness': BrainCircuit,
};

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
}

export default function CommandCenterPage() {
  const { userName } = useProfile();
  const router = useRouter();
  const { data, isLoading, error } = useCommandCenterQuery();
  const dueCount = useRevisionDueCount();
  const { data: plansData } = useSchedulePlansQuery();
  const updateEvent = useUpdateScheduleEvent();

  useEffect(() => {
    localStorage.removeItem('samundar-command-center');
  }, []);

  const todayKey = useMemo(() => dateKey(new Date()), []);
  const todayEvents = useMemo(() => {
    const rows = (plansData?.plans ?? []).flatMap((plan) =>
      plan.events.filter((event) => event.date === todayKey).map((event) => ({ plan, event })),
    );
    return rows.sort((a, b) => (a.event.startTime ?? '99:99').localeCompare(b.event.startTime ?? '99:99'));
  }, [plansData, todayKey]);

  const todayActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (data?.activities ?? []).filter(a => new Date(a.createdAt) >= today);
  }, [data?.activities]);

  const earlierActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (data?.activities ?? []).filter(a => new Date(a.createdAt) < today);
  }, [data?.activities]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading command center...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {userName}! Let&apos;s build something great today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <Badge variant="outline" className="bg-amber-950 text-amber-300 border-amber-800 text-[10px]">
                Offline — showing cached data
              </Badge>
            )}
          </div>
        </div>

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
          </div>
        </LazyAppear>

        <LazyAppear delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border bg-card/40">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Today&apos;s Focus</CardTitle>
                <Link href="/plan/calendar" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Open calendar
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayEvents.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-muted-foreground">Nothing scheduled today</p>
                    <Link href="/plan/calendar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Open calendar <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  todayEvents.map(({ plan, event }) => (
                    <div key={`${plan.scheduleId}:${event.id}`} className="flex items-start gap-3">
                      <button
                        type="button"
                        aria-pressed={event.completed}
                        aria-label={event.completed ? 'Mark not done' : 'Mark done'}
                        onClick={() => updateEvent.mutate({ scheduleId: plan.scheduleId, eventId: event.id, completed: !event.completed })}
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          event.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground',
                        )}
                      >
                        {event.completed && <Check className="h-3 w-3" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-medium', event.completed && 'text-muted-foreground line-through')}>
                          {event.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground tabular-nums">
                          {event.startTime && <>{event.startTime}{event.endTime ? `–${event.endTime}` : ''} · </>}
                          {plan.name}
                        </p>
                      </div>
                    </div>
                  ))
                )}
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
    </div>
  );
}
