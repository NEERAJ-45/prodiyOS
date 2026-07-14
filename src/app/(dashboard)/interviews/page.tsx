'use client';

import * as React from 'react';
import { useMounted } from '@/hooks/useMounted';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useApplicationsQuery, useResetApplications } from '@/hooks/use-interviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Briefcase, Phone, CheckCircle, XCircle, Calendar,
  Building2, Clock, Trash2, AlertTriangle,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { format, isWithinInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const statusLabel: Record<string, { label: string; color: string }> = {
  APPLIED:       { label: 'Applied', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  PHONE_SCREEN:  { label: 'Phone Screen', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
  TECH_ROUND_1:  { label: 'Tech Round 1', color: 'bg-violet-950 text-violet-300 border-violet-800' },
  TECH_ROUND_2:  { label: 'Tech Round 2', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  SYSTEM_DESIGN: { label: 'System Design', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  HR_CULTURE:    { label: 'HR/Culture', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  OFFER:         { label: 'Offer', color: 'bg-green-950 text-green-300 border-green-800' },
  REJECTED:      { label: 'Rejected', color: 'bg-red-950 text-red-300 border-red-800' },
};

const statusFlow: string[] = ['APPLIED', 'PHONE_SCREEN', 'TECH_ROUND_1', 'TECH_ROUND_2', 'SYSTEM_DESIGN', 'HR_CULTURE', 'OFFER'];

function isInProgress(status: string): boolean {
  return statusFlow.includes(status);
}

export default function InterviewsOverviewPage() {
  const { userEmail } = useProfile();
  const { data: appsData } = useApplicationsQuery();
  const resetMutation = useResetApplications();
  const mounted = useMounted();
  const [resetOpen, setResetOpen] = React.useState(false);

  const applications = appsData?.applications ?? [];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  const totalApps = applications.length;
  const activeApps = applications.filter((a) => isInProgress(a.status) && a.status !== 'REJECTED').length;
  const offers = applications.filter((a) => a.status === 'OFFER').length;
  const rejected = applications.filter((a) => a.status === 'REJECTED').length;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const upcomingThisWeek = applications
    .filter((a) => a.nextRoundDate && isInProgress(a.status) && a.status !== 'REJECTED')
    .filter((a) => {
      const d = parseISO(a.nextRoundDate!);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    })
    .sort((a, b) => new Date(a.nextRoundDate!).getTime() - new Date(b.nextRoundDate!).getTime());

  const stats = [
    { label: 'Total Applications', value: totalApps, icon: Briefcase, color: 'text-blue-400' },
    { label: 'Active Interviews', value: activeApps, icon: Phone, color: 'text-violet-400' },
    { label: 'Offers', value: offers, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-400' },
  ];

  async function handleReset() {
    if (!userEmail) return;
    try {
      const data = await resetMutation.mutateAsync();
      if (data.success) {
        toast.success(`Cleared ${data.deleted.applications} applications, ${data.deleted.rounds} rounds`);
      }
    } catch {
      toast.error('Reset failed');
    }
    setResetOpen(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Interview Tracker</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your job applications and interview pipeline</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn('p-2.5 rounded-lg bg-zinc-800/50', stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-zinc-100">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            Upcoming This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingThisWeek.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-zinc-600">
              <Calendar className="h-8 w-8 mb-2" />
              <p className="text-sm">No interviews scheduled this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingThisWeek.map((app) => {
                const status = statusLabel[app.status] || { label: app.status, color: 'bg-zinc-800 text-zinc-400' };
                return (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-zinc-800">
                        <Building2 className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{app.company}</p>
                        <p className="text-xs text-zinc-500 truncate">{app.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className={cn('text-[10px] font-medium', status.color)}>
                        {status.label}
                      </Badge>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {app.nextRoundDate ? format(parseISO(app.nextRoundDate), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-950/40 bg-red-950/5">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/30">
              <Trash2 className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-300">Danger Zone</p>
              <p className="text-xs text-zinc-500">Permanently delete all applications, rounds, and company data</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetOpen(true)}
            className="border-red-800 text-red-400 hover:bg-red-950/30 hover:text-red-300 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Reset All
          </Button>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Confirm Reset
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            This will permanently delete all your applications, interview rounds, and company data. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetOpen(false)} disabled={resetMutation.isPending}>Cancel</Button>
            <Button size="sm" onClick={handleReset} disabled={resetMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
              {resetMutation.isPending ? 'Resetting...' : 'Delete Everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
