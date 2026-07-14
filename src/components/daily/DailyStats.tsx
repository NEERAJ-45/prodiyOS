'use client';

import { Flame, Clock, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function DailyStats({
  dailyStreak,
  minutesDone,
  completedCount,
  totalTasks,
  todaySlotsDone,
  totalSlotsToday,
}: {
  dailyStreak: number;
  minutesDone: number;
  completedCount: number;
  totalTasks: number;
  todaySlotsDone: number;
  totalSlotsToday: number;
}) {
  return (
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
            <p className="text-xl font-bold text-zinc-100">{minutesDone}</p>
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
  );
}
