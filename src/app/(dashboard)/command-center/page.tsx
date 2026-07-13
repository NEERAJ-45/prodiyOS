'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LazyAppear } from "@/components/shared/LazyAppear";
import { useCommandCenterQuery, useUpdateFocusItem } from '@/hooks/use-command-center';
import { useProfile } from "@/components/providers/ProfileProvider";
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
  ON_HOLD: { label: 'On Hold', className: 'bg-zinc-800 text-zinc-400 border-zinc-700', bar: 'bg-zinc-500' },
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
      <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-zinc-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-500 w-8 text-right tabular-nums">{progress}</span>
    </div>
  );
}

export default function CommandCenterPage() {
  const { userName, userEmail } = useProfile();
  const router = useRouter();
  const { data, isLoading, error } = useCommandCenterQuery();
  const updateFocusItem = useUpdateFocusItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLabel, setDialogLabel] = useState('');
  const [dialogValue, setDialogValue] = useState('');
  const [dialogBadge, setDialogBadge] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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

  const handleReset = () => {
    localStorage.removeItem(`samundar-command-center-${userEmail}`);
    localStorage.removeItem('samundar-command-center');
    setResetDialogOpen(false);
  };

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
          <div className="flex flex-col items-center gap-3 text-zinc-500">
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
            <p className="text-sm text-zinc-400 mt-1">
              Welcome back, {userName}! Let&apos;s build something great today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <Badge variant="outline" className="bg-amber-950 text-amber-300 border-amber-800 text-[10px]">
                Offline — showing cached data
              </Badge>
            )}
            <button
              onClick={() => setResetDialogOpen(true)}
              className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 transition-colors px-3 py-1.5 rounded-md bg-red-950/30 hover:bg-red-950/50"
            >
              Reset Dashboard
            </button>
          </div>
        </div>

        <LazyAppear>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.stats.map((stat) => {
              const Icon = ICON_MAP[stat.label] || Zap;
              return (
                <Card key={stat.label} className="border-zinc-800/80 bg-zinc-900/40">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-zinc-500">{stat.sub}</p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/50 p-2.5">
                        <Icon className="h-5 w-5 text-zinc-400" />
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
            <Card className="md:col-span-2 border-zinc-800/80 bg-zinc-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Today&apos;s Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.focusItems.map((item) => {
                  const editable = item.label !== 'Due Revisions';
                  return (
                    <div
                      key={item.label}
                      onClick={() => editable && openFocusDialog(item.label, item.value, item.badge)}
                      className={cn(
                        'flex items-center justify-between',
                        editable && 'cursor-pointer group'
                      )}
                    >
                      <div>
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                          {item.label}
                          {editable && <Pencil className="h-2.5 w-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </p>
                        <p className={cn(
                          'text-sm font-medium mt-0.5',
                          editable && 'group-hover:text-zinc-100 transition-colors'
                        )}>{item.value}</p>
                      </div>
                      <Badge variant="secondary" className={cn(
                        'text-xs bg-zinc-800 text-zinc-300',
                        editable && 'group-hover:bg-zinc-700 transition-colors'
                      )}>
                        {item.badge}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Current Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.projects.length === 0 ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-zinc-600">No projects yet</p>
                    <button onClick={() => router.push('/projects')}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                      <Plus className="h-3 w-3" /> Add projects in Hub
                    </button>
                  </div>
                ) : (
                  data.projects.map((project) => {
                    const style = statusStyles[project.status] || statusStyles.PLANNING;
                    return (
                      <div key={project.name}
                        onClick={() => router.push('/projects')}
                        className="rounded-lg border border-zinc-800/60 bg-zinc-900/20 p-3 space-y-2 hover:border-zinc-700 hover:bg-zinc-900/40 transition-colors cursor-pointer"
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
          <Card className="border-zinc-800/80 bg-zinc-900/40">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Link href="/history?tab=activity" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Show more</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayActivities.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Today</p>
                    {todayActivities.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <p className="text-sm text-zinc-400 flex-1 truncate">{activity.text}</p>
                        <span className="text-[10px] text-zinc-600 shrink-0 tabular-nums">{formatRelativeTime(activity.createdAt)}</span>
                      </div>
                    ))}
                  </>
                )}
                {earlierActivities.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mt-4">Earlier</p>
                    {earlierActivities.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 shrink-0" />
                        <p className="text-sm text-zinc-400 flex-1 truncate">{activity.text}</p>
                        <span className="text-[10px] text-zinc-600 shrink-0 tabular-nums">{formatRelativeTime(activity.createdAt)}</span>
                      </div>
                    ))}
                  </>
                )}
                {data.activities.length === 0 && (
                  <p className="text-sm text-zinc-600 text-center py-4">No activity yet</p>
                )}
              </div>
              <Link href="/history" className="mt-4 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Show more <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </LazyAppear>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit {dialogLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Value</label>
              <Input value={dialogValue} onChange={(e) => setDialogValue(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Badge</label>
              <Input value={dialogBadge} onChange={(e) => setDialogBadge(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveFocusEdit}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Reset Dashboard</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400 py-2">
            This will clear your cached dashboard data and reload with fresh stats from the server.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleReset}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
