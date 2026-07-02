'use client';

import * as React from 'react';
import { useProfile } from '@/components/providers/ProfileProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Briefcase, Phone, CheckCircle, XCircle, Calendar,
  Building2, TrendingUp, Clock,
} from 'lucide-react';
import { format, isWithinInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';

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

interface Application {
  _id: string;
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  status: string;
  source: string;
  priority: string;
  notes?: string;
  nextRoundDate?: string | null;
}

export default function InterviewsOverviewPage() {
  const { userEmail } = useProfile();
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!userEmail) return;
    fetch(`/api/interviews?userEmail=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .catch(() => {});
  }, [userEmail]);

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
    </div>
  );
}
