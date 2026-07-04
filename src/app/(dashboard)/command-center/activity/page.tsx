'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/components/providers/ProfileProvider';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface ActivityEntry {
  text: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function ActivityHistoryPage() {
  const { userEmail } = useProfile();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!userEmail) return;
    setLoading(true);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-user-email': userEmail };
    fetch(`/api/db/activity?userEmail=${encodeURIComponent(userEmail)}`, { headers })
      .then(r => r.json())
      .then(data => {
        setActivities(data.activities ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

  const handleClearHistory = async () => {
    if (!userEmail) return;
    if (!confirm('Are you sure you want to clear your entire activity history?')) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-user-email': userEmail };
      const res = await fetch(`/api/db/activity?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to clear activity history');
      setActivities([]);
      setPage(0);
      toast({ title: 'Success', description: 'Activity history cleared successfully.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const totalPages = Math.ceil(activities.length / PAGE_SIZE);
  const pageActivities = activities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const grouped = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    for (const a of pageActivities) {
      const date = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    }
    return groups;
  }, [pageActivities]);

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        <Link
          href="/command-center"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Command Center
        </Link>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Activity History</h1>
            <p className="text-sm text-zinc-500 mt-1">All your completed items across all roadmaps and sections</p>
          </div>
          {activities.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-800/40 text-red-400 bg-red-950/30 hover:bg-red-950/50 hover:border-red-700/60 transition-colors shrink-0 cursor-pointer self-start sm:self-center"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <p className="text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, entries]) => (
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 mt-6 border border-zinc-800 rounded-lg bg-zinc-900/20 text-sm text-zinc-400">
                <span className="text-xs">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(0)} disabled={page === 0}
                    className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="First">
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                    className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Previous">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                    className="p-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Next">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
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
  );
}
