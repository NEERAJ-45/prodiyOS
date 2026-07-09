'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMounted } from '@/hooks/useMounted';
import { useDailyQuery, useSyncDaily, useActivityLog } from '@/hooks/use-daily';
import {
  CheckCircle2,
  Circle,
  Flame,
  Clock,
  Zap,
  BookOpen,
  Code,
  Brain,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Target,
  Sparkles,
  StickyNote,
  Plus,
  Timer,
  BarChart3,
  Pencil,
  Check,
  X,
  Trash2,
  Edit,
  Server,
  Cloud,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProfile } from '@/components/providers/ProfileProvider';
import { SCHEDULES, SCHEDULE_IDS, getTodaySchedule, getDaySchedule, getRoadmapLink, type ScheduleId, type DaySchedule, type Slot } from '@/data/schedules';
import { STORAGE_KEYS } from '@/lib/storage-keys';

const SCHEDULE_MODE_KEY = STORAGE_KEYS.DAILY_SCHEDULE_MODE;
const SLOT_COMPLETIONS_KEY = STORAGE_KEYS.DAILY_SLOT_COMPLETIONS;
const SLOT_NOTES_KEY = STORAGE_KEYS.DAILY_SLOT_NOTES;
const STORAGE_KEY = STORAGE_KEYS.DAILY_COMPLETIONS;
const NOTES_KEY = STORAGE_KEYS.DAILY_NOTES;

const today = new Date();
const dateStr = today.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
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
  link?: string;
}

const TIME_SLOTS = [
  { start: 360, end: 540 },
  { start: 540, end: 720 },
  { start: 720, end: 780 },
  { start: 780, end: 960 },
  { start: 960, end: 1080 },
  { start: 1080, end: 1140 },
];

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  must: { label: 'Must', className: 'bg-red-950 text-red-300 border-red-800' },
  should: { label: 'Should', className: 'bg-amber-950 text-amber-300 border-amber-800' },
  nice: { label: 'Nice', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
};

function difficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Easy': return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'Hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'Advanced': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  }
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

interface SlotCompletion {
  completed: Record<string, boolean>;
  notes: Record<string, string>;
}

function loadSlotData(): Record<string, SlotCompletion> {
  try {
    const raw = localStorage.getItem(SLOT_COMPLETIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveSlotData(data: Record<string, SlotCompletion>) {
  localStorage.setItem(SLOT_COMPLETIONS_KEY, JSON.stringify(data));
}

function loadSlotNotes(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(SLOT_NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveSlotNotes(data: Record<string, Record<string, string>>) {
  localStorage.setItem(SLOT_NOTES_KEY, JSON.stringify(data));
}

const SCHEDULE_TABS: { id: ScheduleId; label: string; color: string }[] = [
  { id: 'steady', label: 'Steady', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'react', label: 'React', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'java', label: 'Java', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'devops', label: 'DevOps', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'custom', label: 'Custom', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
];

const SLOT_ICONS: Record<string, React.ElementType> = {
  'M1 – DSA': Brain,
  'M2': BookOpen,
  'Night – CS Fundamentals': RefreshCw,
};

const SLOT_COLORS: Record<string, string> = {
  'M1 – DSA': 'border-blue-500/20 bg-blue-500/5',
  'M2': 'border-emerald-500/20 bg-emerald-500/5',
  'Night – CS Fundamentals': 'border-purple-500/20 bg-purple-500/5',
};

const SLOT_BADGE_COLORS: Record<string, string> = {
  'M1 – DSA': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'M2': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Night – CS Fundamentals': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export default function DailyPage() {
  const { userEmail } = useProfile();
  const mounted = useMounted();
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [note, setNote] = React.useState('');
  const [customTasks, setCustomTasks] = React.useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [showAddTask, setShowAddTask] = React.useState(false);

  const [scheduleId, setScheduleId] = React.useState<ScheduleId>('steady');
  const [slotData, setSlotData] = React.useState<Record<string, SlotCompletion>>({});
  const [slotNotes, setSlotNotes] = React.useState<Record<string, Record<string, string>>>({});
  const [showCatchUp, setShowCatchUp] = React.useState(true);

  const [timerMode, setTimerMode] = React.useState<'work' | 'break'>('work');
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [timerSeconds, setTimerSeconds] = React.useState(25 * 60);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingTimerPart, setEditingTimerPart] = React.useState<'h' | 'm' | 's' | null>(null);
  const [editTimerValue, setEditTimerValue] = React.useState('');
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const [workMinutes, setWorkMinutes] = React.useState(25);
  const [breakMinutes, setBreakMinutes] = React.useState(5);
  const WORK_TIME = workMinutes * 60;
  const BREAK_TIME = breakMinutes * 60;

  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = React.useState('');
  const [editTaskTime, setEditTaskTime] = React.useState('');
  const [editTaskDifficulty, setEditTaskDifficulty] = React.useState('');
  const syncRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: dailyDb } = useDailyQuery(todayKey);
  const syncDaily = useSyncDaily();
  const logActivity = useActivityLog();

  const todaySchedule = React.useMemo(() => getTodaySchedule(scheduleId), [scheduleId]);

  const todaySlotsCompleted = React.useMemo(() => {
    return slotData[todayKey]?.completed ?? {};
  }, [slotData, todayKey]);

  const todaySlotNotes = React.useMemo(() => {
    return slotNotes[todayKey] ?? {};
  }, [slotNotes, todayKey]);

  const todaySlotsDone = React.useMemo(() => {
    if (!todaySchedule) return 0;
    return todaySchedule.slots.filter((s) => todaySlotsCompleted[s.period]).length;
  }, [todaySchedule, todaySlotsCompleted]);

  const totalSlotsToday = todaySchedule?.slots.length ?? 3;

  const catchUpMissed = React.useMemo(() => {
    const missed: { date: string; dayName: string; slot: Slot }[] = [];
    const last7 = getDateRange(7);
    for (const dateKey of last7) {
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

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Record<string, string[]> = JSON.parse(saved);
        const todayCompleted = parsed[todayKey] || [];
        setCompleted(new Set(todayCompleted));
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
    if (dailyDb?.record) {
      if (dailyDb.record.completedTaskIds?.length) {
        setCompleted(new Set(dailyDb.record.completedTaskIds));
      }
      if (dailyDb.record.note) {
        setNote(dailyDb.record.note);
      }
    }
  }, [dailyDb]);

  function syncDailyToServer(ids: Set<string>, noteText: string) {
    if (!userEmail) return;
    syncDaily.mutate({ date: todayKey, completedTaskIds: Array.from(ids), note: noteText });
  }

  React.useEffect(() => {
    if (!mounted) return;
    const saved: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    saved[todayKey] = Array.from(completed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => syncDailyToServer(completed, note), 2000);
  }, [completed, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    saved[todayKey] = note;
    localStorage.setItem(NOTES_KEY, JSON.stringify(saved));
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => syncDailyToServer(completed, note), 2000);
  }, [note, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(SCHEDULE_MODE_KEY, scheduleId);
  }, [scheduleId, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    saveSlotData(slotData);
  }, [slotData, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    saveSlotNotes(slotNotes);
  }, [slotNotes, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('daily-custom-tasks', JSON.stringify(customTasks));
  }, [customTasks, mounted]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function toggleSlotCompletion(period: string) {
    setSlotData((prev) => {
      const day = prev[todayKey] ?? { completed: {}, notes: {} };
      const newDay = {
        ...day,
        completed: { ...day.completed, [period]: !day.completed[period] },
      };
      return { ...prev, [todayKey]: newDay };
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
      const newDay = {
        ...day,
        completed: { ...day.completed, [period]: !day.completed[period] },
      };
      return { ...prev, [dateKey]: newDay };
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

  function addCustomTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    const task: Task = {
      id: `custom-${Date.now()}`,
      title,
      time: '30 min',
      difficulty: 'Custom',
      priority: 'should',
    };
    setCustomTasks((p) => [...p, task]);
    setNewTaskTitle('');
    logActivity.mutate(`Added custom daily task "${title}"`);
  }

  function handleDeleteTask(taskId: string) {
    setCustomTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleStartEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskTime(task.time);
    setEditTaskDifficulty(task.difficulty);
  }

  function handleSaveEditTask() {
    if (!editTaskTitle.trim() || !editingTaskId) return;
    setCustomTasks((prev) =>
      prev.map((t) =>
        t.id === editingTaskId
          ? { ...t, title: editTaskTitle.trim(), time: editTaskTime, difficulty: editTaskDifficulty }
          : t
      )
    );
    setEditingTaskId(null);
  }

  function startTimer() { setTimerRunning(true); }

  function pauseTimer() {
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function resetTimer() {
    pauseTimer();
    setTimerSeconds(timerMode === 'work' ? WORK_TIME : BREAK_TIME);
  }

  function switchTimerMode() {
    pauseTimer();
    const next = timerMode === 'work' ? 'break' : 'work';
    setTimerMode(next);
    setTimerSeconds(next === 'work' ? WORK_TIME : BREAK_TIME);
  }

  React.useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  function getAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function playDialSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.07);
    }
  }

  function handleStartEditTimer(part: 'h' | 'm' | 's') {
    const total = timerMode === 'work' ? workMinutes * 60 : breakMinutes * 60;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const vals = { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') };
    setEditingTimerPart(part);
    setEditTimerValue(vals[part]);
    playDialSound();
  }

  function handleEditTimerChange(val: string) {
    setEditTimerValue(val.replace(/\D/g, ''));
    playDialSound();
  }

  function handleEditTimerBlur() {
    if (editingTimerPart && editTimerValue !== '') {
      let total = timerMode === 'work' ? workMinutes * 60 : breakMinutes * 60;
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const num = parseInt(editTimerValue) || 0;
      if (editingTimerPart === 'h') { total = num * 3600 + m * 60 + s; }
      else if (editingTimerPart === 'm') { total = h * 3600 + num * 60 + s; }
      else if (editingTimerPart === 's') { total = h * 3600 + m * 60 + num; }
      const minutes = Math.max(1, Math.round(total / 60));
      if (timerMode === 'work') setWorkMinutes(minutes);
      else setBreakMinutes(minutes);
      setTimerSeconds(total);
    }
    setEditingTimerPart(null);
    setEditTimerValue('');
  }

  function handleEditTimerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    else if (e.key === 'Escape') { setEditingTimerPart(null); setEditTimerValue(''); }
  }

  const [dailyStreak, setDailyStreak] = React.useState(0);

  React.useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const res = await fetch('/api/auth/login-streak');
        if (res.ok) {
          const data = await res.json();
          setDailyStreak(data.streak ?? 0);
          return;
        }
      } catch {}
      const saved: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      let s = 0;
      const d = new Date();
      for (let i = 0; i < 365; i++) {
        const key = d.toISOString().slice(0, 10);
        if (saved[key]?.length) s++;
        else if (i > 0) break;
        d.setDate(d.getDate() - 1);
      }
      setDailyStreak(s);
    })();
  }, [mounted]);

  const timerMinutes = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const timerProgress = timerMode === 'work'
    ? ((WORK_TIME - timerSeconds) / WORK_TIME) * 100
    : ((BREAK_TIME - timerSeconds) / BREAK_TIME) * 100;

  const allTasks = customTasks;
  const completedCount = completed.size;
  const totalTasks = allTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Daily Execution</h1>
              <p className="text-sm text-zinc-500 mt-1">{dateStr}</p>
            </div>
          </div>

          {/* Schedule Mode Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {SCHEDULE_TABS.map((tab) => {
              const isActive = scheduleId === tab.id;
              const schedule = SCHEDULES[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setScheduleId(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                    isActive
                      ? tab.color
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 bg-zinc-900/50',
                  )}
                  title={schedule.description}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
                  <Flame className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">{dailyStreak}</p>
                  <p className="text-[11px] text-zinc-500">Day Streak</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">
                    {allTasks.filter((t) => completed.has(t.id)).reduce((sum, t) => {
                      const mins = parseInt(t.time);
                      return sum + (isNaN(mins) ? 0 : mins);
                    }, 0)}
                  </p>
                  <p className="text-[11px] text-zinc-500">Min Done</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                  <Target className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">{completedCount}/{totalTasks}</p>
                  <p className="text-[11px] text-zinc-500">Tasks Done</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">{todaySlotsDone}/{totalSlotsToday}</p>
                  <p className="text-[11px] text-zinc-500">Slots Done</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Slot Progress */}
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

          {/* Main content grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left column — Schedule + Catch-up */}
            <div className="xl:col-span-2 space-y-4">
              {/* Today's Plan */}
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
                  {todaySchedule?.slots.map((slot) => {
                    const isDone = todaySlotsCompleted[slot.period];
                    const slotNote = todaySlotNotes[slot.period] ?? '';
                    const SlotIcon = SLOT_ICONS[slot.period] ?? Brain;
                    return (
                      <div
                        key={slot.period}
                        className={cn(
                          'rounded-lg border p-3 transition-all',
                          isDone ? 'border-emerald-500/20 bg-emerald-500/5' : SLOT_COLORS[slot.period],
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleSlotCompletion(slot.period)}
                            className="mt-0.5 shrink-0 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-zinc-600 hover:text-zinc-400 transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', SLOT_BADGE_COLORS[slot.period])}>
                                <SlotIcon className="h-3 w-3 mr-1 inline" />
                                {slot.period}
                              </Badge>
                              <span className={cn('text-sm font-medium', isDone ? 'text-zinc-500 line-through' : 'text-zinc-200')}>
                                {slot.topic}
                              </span>
                               {(() => {
                                 const roadmapLink = getRoadmapLink(slot.topic, slot.period);
                                 return roadmapLink ? (
                                   <Link
                                     href={roadmapLink}
                                     className={cn(
                                       "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 hover:scale-105 active:scale-95 transition-all font-semibold cursor-pointer animate-bounce shadow-sm ml-1.5 shrink-0",
                                       isDone && "opacity-50 pointer-events-none"
                                     )}
                                   >
                                     <span>Confused? what to Study:?</span>
                                     <ArrowUpRight className="h-3 w-3 shrink-0" />
                                   </Link>
                                 ) : null;
                               })()}
                            </div>
                            {slot.description && (
                              <p className="text-[11px] text-zinc-600 mt-0.5">{slot.description}</p>
                            )}
                            <div className="mt-2">
                              <textarea
                                value={slotNote}
                                onChange={(e) => updateSlotNote(slot.period, e.target.value)}
                                placeholder="What did you study? Wins, struggles..."
                                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md p-2 text-xs text-zinc-400 outline-none resize-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600 h-14"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!todaySchedule && (
                    <p className="text-sm text-zinc-600 text-center py-4">No schedule found for today.</p>
                  )}
                </CardContent>
              </Card>

              {/* Catch-up Section */}
              {catchUpMissed.length > 0 && (
                <Card className="bg-card/50 border-amber-500/20">
                  <CardHeader
                    className="p-4 pb-3 cursor-pointer select-none"
                    onClick={() => setShowCatchUp(!showCatchUp)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <CardTitle className="text-sm font-medium text-zinc-200">
                          Catch-up ({catchUpMissed.length} missed slots)
                        </CardTitle>
                      </div>
                      {showCatchUp ? (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>
                  </CardHeader>
                  {showCatchUp && (
                    <CardContent className="p-4 pt-1 space-y-2">
                      {catchUpMissed.map((missed, i) => {
                        const dateCompletions = slotData[missed.date]?.completed ?? {};
                        const isNowDone = dateCompletions[missed.slot.period];
                        return (
                          <div
                            key={`${missed.date}-${missed.slot.period}`}
                            className={cn(
                              'flex items-center gap-3 rounded-lg border p-2.5 transition-all',
                              isNowDone
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : 'border-zinc-800 bg-zinc-900/30',
                            )}
                          >
                            <button
                              onClick={() => toggleCatchUpSlot(missed.date, missed.slot.period)}
                              className="shrink-0 cursor-pointer"
                            >
                              {isNowDone ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Circle className="h-4 w-4 text-zinc-600 hover:text-zinc-400 transition-colors" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-zinc-500">{missed.dayName} {missed.date.slice(5)}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-zinc-500 border-zinc-700">
                                  {missed.slot.period}
                                </Badge>
                                <span className={cn('text-xs', isNowDone ? 'text-zinc-500 line-through' : 'text-zinc-300')}>
                                  {missed.slot.topic}
                                </span>
                                {(() => {
                                  const roadmapLink = getRoadmapLink(missed.slot.topic, missed.slot.period);
                                  return roadmapLink ? (
                                    <Link
                                      href={roadmapLink}
                                      className={cn(
                                        "inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 hover:scale-105 active:scale-95 transition-all font-semibold cursor-pointer animate-bounce shadow-sm ml-1.5 shrink-0",
                                        isNowDone && "opacity-50 pointer-events-none"
                                      )}
                                    >
                                      <span>Confused? what to Study:?</span>
                                      <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                                    </Link>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Custom Tasks */}
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-200">Additional Tasks</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2">
                  {customTasks.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-2">No additional tasks yet.</p>
                  )}
                  {customTasks.map((task) => {
                    const isDone = completed.has(task.id);
                    const isEditing = editingTaskId === task.id;
                    if (isEditing) {
                      return (
                        <div key={task.id} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-2.5">
                          <Input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} className="flex-1 h-7 text-xs bg-zinc-800 border-zinc-700" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditTask(); if (e.key === 'Escape') setEditingTaskId(null); }} autoFocus />
                          <Input value={editTaskTime} onChange={(e) => setEditTaskTime(e.target.value)} className="w-14 h-7 text-xs bg-zinc-800 border-zinc-700" />
                          <select value={editTaskDifficulty} onChange={(e) => setEditTaskDifficulty(e.target.value)} className="h-7 text-[10px] bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-300 outline-none">
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                          </select>
                          <button onClick={handleSaveEditTask} className="p-1 rounded hover:bg-zinc-800 text-green-500 cursor-pointer">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingTaskId(null)} className="p-1 rounded hover:bg-zinc-800 text-red-500 cursor-pointer">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-2.5 transition-all group',
                          isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30',
                        )}
                      >
                        <button onClick={() => toggleTask(task.id)} className="shrink-0 cursor-pointer">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                          )}
                        </button>
                        <span className={cn('flex-1 text-sm', isDone && 'line-through text-zinc-600')}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-zinc-600">{task.time}</span>
                          <button onClick={() => handleStartEditTask(task)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 pt-1">
                    {showAddTask ? (
                      <>
                        <Input
                          placeholder="Add a custom task..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { addCustomTask(); setShowAddTask(false); }
                            if (e.key === 'Escape') setShowAddTask(false);
                          }}
                          className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm flex-1"
                          autoFocus
                        />
                        <Button variant="outline" size="icon" onClick={() => { addCustomTask(); setShowAddTask(false); }} disabled={!newTaskTitle.trim()}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddTask(false)} className="text-zinc-500 hover:text-zinc-300">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setShowAddTask(true); setNewTaskTitle(''); }}
                        className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Add a task"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Focus Timer */}
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-rose-400" />
                      <CardTitle className="text-sm font-medium text-zinc-200">Focus Timer</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] cursor-pointer',
                        timerMode === 'work'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800',
                      )}
                      onClick={switchTimerMode}
                    >
                      {timerMode === 'work' ? 'Focus' : 'Break'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col items-center gap-4">
                  <div className="relative w-36 h-36">
                    <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#27272a" strokeWidth="8" />
                      <circle
                        cx="80" cy="80" r="70" fill="none"
                        stroke={timerMode === 'work' ? '#fb7185' : '#34d399'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - timerProgress / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-1">
                      <div className="flex items-baseline gap-0">
                        {editingTimerPart === 'h' ? (
                          <input autoFocus value={editTimerValue} onChange={(e) => handleEditTimerChange(e.target.value)} onBlur={handleEditTimerBlur} onKeyDown={handleEditTimerKeyDown} className="w-9 bg-zinc-800/80 text-center rounded-md outline-none ring-2 ring-zinc-600 text-zinc-100 text-2xl font-bold tabular-nums" />
                        ) : (
                          <button onClick={() => !timerRunning && handleStartEditTimer('h')} className="hover:bg-zinc-800/60 rounded-md px-1 -mx-1 transition-all text-2xl font-bold text-zinc-100 tabular-nums tracking-wide cursor-pointer" title="Edit hours">
                            {String(Math.floor(timerSeconds / 3600)).padStart(2, '0')}
                          </button>
                        )}
                        <span className="text-2xl font-bold text-zinc-600 tabular-nums -mx-0.5">:</span>
                        {editingTimerPart === 'm' ? (
                          <input autoFocus value={editTimerValue} onChange={(e) => handleEditTimerChange(e.target.value)} onBlur={handleEditTimerBlur} onKeyDown={handleEditTimerKeyDown} className="w-9 bg-zinc-800/80 text-center rounded-md outline-none ring-2 ring-zinc-600 text-zinc-100 text-2xl font-bold tabular-nums" />
                        ) : (
                          <button onClick={() => !timerRunning && handleStartEditTimer('m')} className="hover:bg-zinc-800/60 rounded-md px-1 -mx-1 transition-all text-2xl font-bold text-zinc-100 tabular-nums tracking-wide cursor-pointer" title="Edit minutes">
                            {String(timerMinutes).padStart(2, '0')}
                          </button>
                        )}
                        <span className="text-2xl font-bold text-zinc-600 tabular-nums -mx-0.5">:</span>
                        {editingTimerPart === 's' ? (
                          <input autoFocus value={editTimerValue} onChange={(e) => handleEditTimerChange(e.target.value)} onBlur={handleEditTimerBlur} onKeyDown={handleEditTimerKeyDown} className="w-9 bg-zinc-800/80 text-center rounded-md outline-none ring-2 ring-zinc-600 text-zinc-100 text-2xl font-bold tabular-nums" />
                        ) : (
                          <button onClick={() => !timerRunning && handleStartEditTimer('s')} className="hover:bg-zinc-800/60 rounded-md px-1 -mx-1 transition-all text-2xl font-bold text-zinc-100 tabular-nums tracking-wide cursor-pointer" title="Edit seconds">
                            {String(timerSecs).padStart(2, '0')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!timerRunning ? (
                      <Button variant="outline" size="sm" onClick={startTimer} disabled={timerSeconds === 0}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Start
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={pauseTimer}>
                        <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={resetTimer}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Notes */}
              <Card className="bg-card/50 border-zinc-800">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-amber-400" />
                    <CardTitle className="text-sm font-medium text-zinc-200">Daily Reflection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What did you learn today? Wins, struggles, thoughts..."
                    className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none resize-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600"
                  />
                </CardContent>
              </Card>

              {/* Quick Legend */}
              <Card className="bg-card/50 border-zinc-800">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Schedule Legend</p>
                  <div className="space-y-1.5">
                    {SCHEDULE_TABS.map((tab) => (
                      <div key={tab.id} className="flex items-center gap-2 text-xs">
                        <div className={cn('w-2 h-2 rounded-full', tab.color.split(' ')[0].replace('text-', 'bg-'))} />
                        <span className="text-zinc-400">{tab.label}</span>
                        <span className="text-zinc-600 ml-auto text-[10px]">{SCHEDULES[tab.id].description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
