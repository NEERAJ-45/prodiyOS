'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRevisionsQuery } from '@/hooks/use-revision';
import { useApplicationsQuery } from '@/hooks/use-interviews';
import { getTodaySchedule, type ScheduleId, type Slot } from '@/data/schedules';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { notify } from '@/lib/notifications';
import type { FetchRevisionResponse } from '@/lib/services/revision';

const SLOT_HOURS: Record<Slot['period'], number> = {
  'M1 – DSA': 9,
  'M2': 14,
  'Night – CS Fundamentals': 20,
};

function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function checkRevisions(queryClient: ReturnType<typeof useQueryClient>) {
  const data = queryClient.getQueryData(['revisions']) as FetchRevisionResponse | undefined;
  const items = data?.data ?? [];
  if (!items.length) return;

  const today = localDateString();
  const due = items.filter((i) => !i.completed && i.dueDate && i.dueDate.slice(0, 10) <= today);
  if (!due.length) return;

  const overdue = due.filter((i) => i.dueDate.slice(0, 10) < today).length;
  const body =
    overdue > 0
      ? `${due.length} due, ${overdue} overdue — e.g. ${due[0].concept}`
      : `e.g. ${due[0].concept} and ${due.length - 1} more`;

  notify('revision', `${due.length} revision${due.length === 1 ? '' : 's'} due`, {
    body,
    dedupeKey: `revision-${today}`,
  });
}

function checkTasks(today: string) {
  interface Task {
    title?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }
  const tasks = readJson<Task[]>(STORAGE_KEYS.TASKS, []);
  const due = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      (t.priority === 'high' || t.priority === 'critical') &&
      t.dueDate &&
      t.dueDate.slice(0, 10) <= today
  );
  if (!due.length) return;

  const names = due
    .slice(0, 3)
    .map((t) => t.title || 'Untitled')
    .join(', ');
  notify('tasks', `${due.length} task${due.length === 1 ? '' : 's'} due`, {
    body: names + (due.length > 3 ? '…' : ''),
    dedupeKey: `tasks-${today}`,
  });
}

function checkInterviews(queryClient: ReturnType<typeof useQueryClient>) {
  const data = queryClient.getQueryData(['interviews', 'applications']) as
    | { applications?: { id: string; company: string; role: string; nextRoundDate?: string | null }[] }
    | { id: string; company: string; role: string; nextRoundDate?: string | null }[]
    | undefined;

  const apps = Array.isArray(data) ? data : data?.applications ?? [];
  const now = Date.now();

  for (const app of apps) {
    if (!app.nextRoundDate) continue;
    const target = new Date(app.nextRoundDate).getTime();
    if (Number.isNaN(target)) continue;
    const diff = target - now;
    if (diff < -6 * 60 * 60 * 1000 || diff > 24 * 60 * 60 * 1000) continue;

    const when =
      diff < 0
        ? 'happening now'
        : diff < 2 * 60 * 60 * 1000
          ? `in ${Math.max(1, Math.round(diff / 3_600_000))}h`
          : 'tomorrow';
    notify('interviews', `Interview at ${app.company} ${when}`, {
      body: `${app.role} — ${new Date(app.nextRoundDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      tag: `interview-${app.id}`,
      dedupeKey: `interview-${app.id}-${app.nextRoundDate}`,
    });
  }
}

function checkSchedule(now: Date) {
  const today = localDateString(now);
  const hour = now.getHours();

  let scheduleId: ScheduleId = 'steady';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_SCHEDULE_MODE);
    if (saved) scheduleId = saved as ScheduleId;
  } catch {}

  const daySchedule = getTodaySchedule(scheduleId);
  if (!daySchedule) return;

  const slotData = readJson<Record<string, { completed?: Record<string, boolean> }>>(
    STORAGE_KEYS.DAILY_SLOT_COMPLETIONS,
    {}
  );
  const completedToday = slotData[today]?.completed ?? {};

  for (const slot of daySchedule.slots) {
    const slotHour = SLOT_HOURS[slot.period];
    if (slotHour === undefined) continue;
    if (completedToday[slot.period]) continue;

    if (hour === slotHour) {
      notify('schedule', `Up next: ${slot.topic}`, {
        body: `${slot.period} starts now.`,
        dedupeKey: `slot-start-${today}-${slot.period}`,
      });
    } else if (hour === slotHour + 1) {
      notify('schedule', `Missed slot: ${slot.topic}`, {
        body: `${slot.period} was due at ${slotHour}:00.`,
        dedupeKey: `slot-miss-${today}-${slot.period}`,
      });
    }
  }

  if (hour >= 21) {
    const anySlotDone = Object.values(completedToday).some(Boolean);
    const daily = readJson<Record<string, string[]>>(STORAGE_KEYS.DAILY_COMPLETIONS, {});
    const anyTaskDone = (daily[today] ?? []).length > 0;
    if (!anySlotDone && !anyTaskDone) {
      notify('schedule', 'Streak at risk', {
        body: 'Complete one slot or task today to keep your streak.',
        dedupeKey: `streak-${today}`,
      });
    }
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Keep event data warm in the query cache
  useRevisionsQuery();
  useApplicationsQuery();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      try {
        checkRevisions(queryClient);
        checkTasks(localDateString(now));
        checkInterviews(queryClient);
        checkSchedule(now);
      } catch {
        // never let notification checks break the app
      }
    };

    const first = setTimeout(tick, 30_000);
    const interval = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [queryClient]);

  return <>{children}</>;
}
