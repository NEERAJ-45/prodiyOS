'use client';

import * as React from 'react';
import { useMounted } from '@/hooks/useMounted';
import { useDailyQuery, useSyncDaily, useActivityLog } from '@/hooks/use-daily';
import { useLoginStreakQuery } from '@/hooks/use-login-streak';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProfile } from '@/components/providers/ProfileProvider';
import { SCHEDULES, SCHEDULE_IDS, getTodaySchedule, getDaySchedule, type ScheduleId, type Slot } from '@/data/schedules';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { ScheduleTabs } from '@/components/daily/ScheduleTabs';
import { DailyStats } from '@/components/daily/DailyStats';
import { SlotCard } from '@/components/daily/SlotCard';
import { CatchUpSection } from '@/components/daily/CatchUpSection';
import { CustomTaskList } from '@/components/daily/CustomTaskList';
import { FocusTimer } from '@/components/daily/FocusTimer';
import { DailyReflection } from '@/components/daily/DailyReflection';
import { ScheduleLegend } from '@/components/daily/ScheduleLegend';

const SCHEDULE_MODE_KEY = STORAGE_KEYS.DAILY_SCHEDULE_MODE;
const SLOT_COMPLETIONS_KEY = STORAGE_KEYS.DAILY_SLOT_COMPLETIONS;
const SLOT_NOTES_KEY = STORAGE_KEYS.DAILY_SLOT_NOTES;
const STORAGE_KEY = STORAGE_KEYS.DAILY_COMPLETIONS;
const NOTES_KEY = STORAGE_KEYS.DAILY_NOTES;

const today = new Date();
const dateStr = today.toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});
const todayKey = today.toISOString().slice(0, 10);
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const todayDayName = DAY_ABBREV[today.getDay()];

type Priority = 'must' | 'should' | 'nice';

interface Task {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  priority: Priority;
}

interface SlotCompletion {
  completed: Record<string, boolean>;
  notes: Record<string, string>;
}

function getDateRange(daysBack: number): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function loadSlotData(): Record<string, SlotCompletion> {
  try {
    const raw = localStorage.getItem(SLOT_COMPLETIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function loadSlotNotes(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(SLOT_NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export default function DailyPage() {
  const { userEmail } = useProfile();
  const mounted = useMounted();
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [note, setNote] = React.useState('');
  const [customTasks, setCustomTasks] = React.useState<Task[]>([]);
  const [scheduleId, setScheduleId] = React.useState<ScheduleId>('steady');
  const [slotData, setSlotData] = React.useState<Record<string, SlotCompletion>>({});
  const [slotNotes, setSlotNotes] = React.useState<Record<string, Record<string, string>>>({});
  const [showCatchUp, setShowCatchUp] = React.useState(true);

  const { data: dailyDb } = useDailyQuery(todayKey);
  const syncDaily = useSyncDaily();
  const logActivity = useActivityLog();

  const todaySchedule = React.useMemo(() => getTodaySchedule(scheduleId), [scheduleId]);
  const todaySlotsCompleted = React.useMemo(() => slotData[todayKey]?.completed ?? {}, [slotData]);
  const todaySlotNotes = React.useMemo(() => slotNotes[todayKey] ?? {}, [slotNotes]);
  const todaySlotsDone = React.useMemo(
    () => todaySchedule ? todaySchedule.slots.filter((s) => todaySlotsCompleted[s.period]).length : 0,
    [todaySchedule, todaySlotsCompleted],
  );
  const totalSlotsToday = todaySchedule?.slots.length ?? 3;

  const catchUpMissed = React.useMemo(() => {
    const missed: { date: string; dayName: string; slot: Slot }[] = [];
    for (const dateKey of getDateRange(7)) {
      const d = new Date(dateKey + 'T12:00:00');
      const dayName = DAY_ABBREV[d.getDay()];
      const daySchedule = getDaySchedule(scheduleId, dayName);
      if (!daySchedule) continue;
      const dayCompletions = slotData[dateKey]?.completed ?? {};
      for (const slot of daySchedule.slots) {
        if (!dayCompletions[slot.period]) {
          missed.push({ date: dateKey, dayName, slot });
        }
      }
    }
    return missed;
  }, [scheduleId, slotData]);

  const syncDailyToServer = React.useCallback((ids: Set<string>, noteText: string) => {
    if (!userEmail) return;
    syncDaily.mutate({ date: todayKey, completedTaskIds: Array.from(ids), note: noteText });
  }, [userEmail, syncDaily]);

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Record<string, string[]> = JSON.parse(saved);
        setCompleted(new Set(parsed[todayKey] || []));
      } catch {}
    }
    const savedNote = localStorage.getItem(NOTES_KEY);
    if (savedNote) {
      try {
        const notes: Record<string, string> = JSON.parse(savedNote);
        setNote(notes[todayKey] || '');
      } catch {}
    }
    const savedMode = localStorage.getItem(SCHEDULE_MODE_KEY);
    if (savedMode && SCHEDULE_IDS.includes(savedMode as ScheduleId)) {
      setScheduleId(savedMode as ScheduleId);
    }
    setSlotData(loadSlotData());
    setSlotNotes(loadSlotNotes());
    const savedTasks = localStorage.getItem('daily-custom-tasks');
    if (savedTasks) {
      try { setCustomTasks(JSON.parse(savedTasks)); } catch {}
    }
  }, []);

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

      localStorage.setItem(SCHEDULE_MODE_KEY, scheduleId);
      localStorage.setItem(SLOT_COMPLETIONS_KEY, JSON.stringify(slotData));
      localStorage.setItem(SLOT_NOTES_KEY, JSON.stringify(slotNotes));
      localStorage.setItem('daily-custom-tasks', JSON.stringify(customTasks));

      syncDailyToServer(completed, note);
    }, 2000);
    return () => clearTimeout(id);
  }, [completed, note, scheduleId, slotData, slotNotes, customTasks, mounted, syncDailyToServer]);

  function toggleSlotCompletion(period: string) {
    setSlotData((prev) => {
      const day = prev[todayKey] ?? { completed: {}, notes: {} };
      return { ...prev, [todayKey]: { ...day, completed: { ...day.completed, [period]: !day.completed[period] } } };
    });
    logActivity.mutate(`Toggled "${period}" slot completion`);
  }

  function updateSlotNote(period: string, text: string) {
    setSlotNotes((prev) => {
      const day = prev[todayKey] ?? {};
      return { ...prev, [todayKey]: { ...day, [period]: text } };
    });
  }

  function toggleCatchUpSlot(dateKey: string, period: string) {
    setSlotData((prev) => {
      const day = prev[dateKey] ?? { completed: {}, notes: {} };
      return { ...prev, [dateKey]: { ...day, completed: { ...day.completed, [period]: !day.completed[period] } } };
    });
  }

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

  const slotProgressPct = Math.round((todaySlotsDone / totalSlotsToday) * 100);

  if (!mounted) {
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
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Daily Execution</h1>
              <p className="text-sm text-zinc-500 mt-1">{dateStr}</p>
            </div>
          </div>

          <ScheduleTabs scheduleId={scheduleId} onChange={setScheduleId} />

          <DailyStats
            dailyStreak={dailyStreak}
            minutesDone={minutesDone}
            completedCount={completed.size}
            totalTasks={customTasks.length}
            todaySlotsDone={todaySlotsDone}
            totalSlotsToday={totalSlotsToday}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Today&apos;s Schedule Progress</span>
              <span className="text-zinc-400">{slotProgressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 transition-all duration-700"
                style={{ width: `${slotProgressPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      <CardTitle className="text-sm font-medium text-zinc-200">
                        {todayDayName}&apos;s Plan — {SCHEDULES[scheduleId].label}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                      {todaySlotsDone}/{totalSlotsToday} done
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  {todaySchedule?.slots.map((slot) => (
                    <SlotCard
                      key={slot.period}
                      slot={slot}
                      isDone={todaySlotsCompleted[slot.period] ?? false}
                      slotNote={todaySlotNotes[slot.period] ?? ''}
                      onToggle={() => toggleSlotCompletion(slot.period)}
                      onNoteChange={(text) => updateSlotNote(slot.period, text)}
                    />
                  ))}
                  {!todaySchedule && (
                    <p className="text-sm text-zinc-600 text-center py-4">No schedule found for today.</p>
                  )}
                </CardContent>
              </Card>

              <CatchUpSection
                missed={catchUpMissed}
                showCatchUp={showCatchUp}
                onToggleSection={() => setShowCatchUp(!showCatchUp)}
                onToggleSlot={toggleCatchUpSlot}
                getSlotCompletion={(dateKey, period) => slotData[dateKey]?.completed[period] ?? false}
              />

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
              <ScheduleLegend />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
