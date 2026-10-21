'use client';

import * as React from 'react';
import { useMounted } from '@/hooks/useMounted';
import { useActivityLogQuery, useClearActivityLog } from '@/hooks/use-history';
import {
  ListOrdered,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { useProfile } from '@/components/providers/ProfileProvider';
import { toast } from '@/components/ui/toast';

interface ActivityItem {
  text: string;
  createdAt: string;
}

const ACTIVITY_PAGE_SIZE = 20;

export default function HistoryPage() {
  const { userEmail } = useProfile();
  const mounted = useMounted();
  const { data: activityData, isLoading: activityLoading } = useActivityLogQuery();
  const clearActivity = useClearActivityLog();

  const activities = React.useMemo(() => activityData?.activities ?? [], [activityData]);

  const [activityPage, setActivityPage] = React.useState(0);

  const handleClearHistory = async () => {
    if (!userEmail) return;
    if (!confirm('Are you sure you want to clear your entire activity history?')) return;
    try {
      await clearActivity.mutateAsync();
      toast({ title: 'Success', description: 'Activity history cleared successfully.' });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'An error occurred' });
    }
  };

  const totalActivityPages = Math.ceil(activities.length / ACTIVITY_PAGE_SIZE);
  const pageActivities = React.useMemo(() => {
    return activities.slice(activityPage * ACTIVITY_PAGE_SIZE, (activityPage + 1) * ACTIVITY_PAGE_SIZE);
  }, [activities, activityPage]);

  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    for (const a of pageActivities) {
      const date = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    }
    return groups;
  }, [pageActivities]);

  if (!mounted || activityLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <ListOrdered className="h-6 w-6 text-zinc-400" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Activity</h1>
              <p className="text-sm text-zinc-500 mt-1">Your recent activity across the platform</p>
            </div>
          </div>

          {activities.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-800/40 text-red-400 bg-red-950/30 hover:bg-red-950/50 hover:border-red-700/60 transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Activity History
              </button>
            </div>
          )}

          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
              <ListOrdered className="h-12 w-12 mb-3 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500">No activity yet</p>
              <p className="text-xs text-zinc-600 mt-1">Your activity log will appear here as you use the platform.</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {Object.entries(groupedActivities).map(([date, entries]) => (
                  <div key={date}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">{date}</h3>
                    <div className="space-y-2">
                      {entries.map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                          <p className="text-sm text-zinc-300 flex-1">{entry.text}</p>
                          <span className="text-[10px] text-zinc-600 shrink-0 tabular-nums whitespace-nowrap">
                            {formatRelativeTime(entry.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {totalActivityPages > 1 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 mt-6 border border-zinc-800 rounded-lg bg-zinc-900/20 text-sm text-zinc-400">
                  <span className="text-xs">
                    Page {activityPage + 1} of {totalActivityPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setActivityPage(0)} disabled={activityPage === 0}
                      className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="First">
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setActivityPage(p => p - 1)} disabled={activityPage === 0}
                      className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Previous">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setActivityPage(p => p + 1)} disabled={activityPage >= totalActivityPages - 1}
                      className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Next">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button onClick={() => setActivityPage(totalActivityPages - 1)} disabled={activityPage >= totalActivityPages - 1}
                      className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Last">
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
