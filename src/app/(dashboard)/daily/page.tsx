'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMounted } from '@/hooks/useMounted';
import { useDailyQuery, useSyncDaily, useActivityLog } from '@/hooks/use-daily';
import { useLoginStreakQuery } from '@/hooks/use-login-streak';
import { useSchedulePlansQuery } from '@/hooks/use-schedule-plans';
import { CalendarDays } from 'lucide-react';
import { useProfile } from '@/components/providers/ProfileProvider';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { DailyStats } from '@/components/daily/DailyStats';
import { CustomTaskList } from '@/components/daily/CustomTaskList';
import { FocusTimer } from '@/components/daily/FocusTimer';
import { DailyReflection } from '@/components/daily/DailyReflection';
import { SyncStatus, type SyncState } from '@/components/shared/SyncStatus';
import { PlanEvents } from '@/components/shared/PlanEvents';

const STORAGE_KEY = STORAGE_KEYS.DAILY_COMPLETIONS;
const NOTES_KEY = STORAGE_KEYS.DAILY_NOTES;

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Priority = 'must' | 'should' | 'nice';

interface Task {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  priority: Priority;
}

export default function DailyPage() {
  const { userEmail } = useProfile();
  const mounted = useMounted();
  const [now, setNow] = React.useState(() => new Date());
  const todayKey = toKey(now);
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const [syncState, setSyncState] = React.useState<SyncState>('idle');
  const [completed, setCompleted] = React.useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Record<string, string[]> = JSON.parse(saved);
        return new Set(parsed[todayKey] || []);
      }
    } catch {}
    return new Set();
  });
  const [note, setNote] = React.useState(() => {
    try {
      const savedNote = localStorage.getItem(NOTES_KEY);
      if (savedNote) {
        const notes: Record<string, string> = JSON.parse(savedNote);
        return notes[todayKey] || '';
      }
    } catch {}
    return '';
  });
  const [customTasks, setCustomTasks] = React.useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('daily-custom-tasks');
      if (savedTasks) return JSON.parse(savedTasks);
    } catch {}
    return [];
  });

  React.useEffect(() => {
    const check = () => {
      const t = new Date();
      setNow((prev) => (toKey(prev) === toKey(t) ? prev : t));
    };
    const id = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  const prevDayKeyRef = React.useRef(todayKey);
  React.useEffect(() => {
    if (prevDayKeyRef.current === todayKey) return;
    prevDayKeyRef.current = todayKey;
    try {
      const saved: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setCompleted(new Set(saved[todayKey] || []));
      const notes: Record<string, string> = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
      setNote(notes[todayKey] || '');
    } catch {
      setCompleted(new Set());
      setNote('');
    }
  }, [todayKey]);

  const { data: dailyDb } = useDailyQuery(todayKey);
  const syncDaily = useSyncDaily();
  const logActivity = useActivityLog();
  const { data: plansData } = useSchedulePlansQuery();

  const todayEvents = React.useMemo(
    () => (plansData?.plans ?? []).flatMap((plan) => plan.events.filter((event) => event.date === todayKey)),
    [plansData, todayKey],
  );
  const eventsDone = todayEvents.filter((event) => event.completed).length;

  const syncDailyToServer = React.useCallback((ids: Set<string>, noteText: string) => {
    if (!userEmail) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncState('offline');
      return;
    }
    setSyncState('saving');
    syncDaily.mutate(
      { date: todayKey, completedTaskIds: Array.from(ids), note: noteText },
      { onSettled: (_data, error) => setSyncState(error ? 'error' : 'saved') },
    );
  }, [userEmail, syncDaily, todayKey]);

  React.useEffect(() => {
    if (!dailyDb?.record) return;
    if (dailyDb.record.completedTaskIds?.length) {
      setCompleted(new Set(dailyDb.record.completedTaskIds));
    }
    if (dailyDb.record.note) {
      setNote(dailyDb.record.note);
    }
  }, [dailyDb]);

  React.useEffect(() => {
    if (!mounted) return;
    const id = setTimeout(() => {
      const saved: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      saved[todayKey] = Array.from(completed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const savedNotes: Record<string, string> = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
      savedNotes[todayKey] = note;
      localStorage.setItem(NOTES_KEY, JSON.stringify(savedNotes));

      localStorage.setItem('daily-custom-tasks', JSON.stringify(customTasks));

      syncDailyToServer(completed, note);
    }, 2000);
    return () => clearTimeout(id);
  }, [completed, note, customTasks, mounted, syncDailyToServer, todayKey]);

  function toggleTask(id: string) {
    const wasCompleted = completed.has(id);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    logActivity.mutate(wasCompleted ? 'Uncompleted a daily task' : 'Completed a daily task');
  }

  const { data: streakData } = useLoginStreakQuery();
  const dailyStreak = streakData?.streak ?? (() => {
    const saved: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      if (saved[key]?.length) s++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const minutesDone = customTasks
    .filter((t) => completed.has(t.id))
    .reduce((sum, t) => sum + (parseInt(t.time) || 0), 0);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Daily Execution</h1>
                <SyncStatus state={syncState} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
            </div>
            <Link
              href="/plan/calendar"
              className="inline-flex items-center gap-1.5 self-start text-xs px-2.5 py-1 rounded-md border bg-card hover:bg-muted transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Edit in calendar
            </Link>
          </div>

          <DailyStats
            dailyStreak={dailyStreak}
            minutesDone={minutesDone}
            completedCount={completed.size}
            totalTasks={customTasks.length}
            todaySlotsDone={eventsDone}
            totalSlotsToday={todayEvents.length}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <PlanEvents dates={[todayKey]} />
              <CustomTaskList
                tasks={customTasks}
                completed={completed}
                onToggle={toggleTask}
                onAdd={(task) => setCustomTasks((p) => [...p, task])}
                onDelete={(id) => setCustomTasks((p) => p.filter((t) => t.id !== id))}
                onEdit={(id, updated) => setCustomTasks((p) => p.map((t) => t.id === id ? { ...t, ...updated } : t))}
                logActivity={(text) => logActivity.mutate(text)}
              />
            </div>

            <div className="space-y-4">
              <FocusTimer />
              <DailyReflection note={note} onChange={setNote} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
