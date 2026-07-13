'use client';

import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePomodoro } from '@/hooks/use-pomodoro';

export function FocusTimer() {
  const {
    timerMode,
    timerRunning,
    timerMinutes,
    timerSecs,
    timerProgress,
    editingTimer,
    editTimerValue,
    startTimer,
    pauseTimer,
    resetTimer,
    switchTimerMode,
    startEditingTimer,
    handleEditTimerChange,
    handleEditTimerBlur,
    handleEditTimerKeyDown,
  } = usePomodoro();

  return (
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
            {editingTimer ? (
              <input
                autoFocus
                value={editTimerValue}
                onChange={(e) => handleEditTimerChange(e.target.value)}
                onBlur={handleEditTimerBlur}
                onKeyDown={handleEditTimerKeyDown}
                className="w-16 bg-zinc-800/80 text-center rounded-md outline-none ring-2 ring-zinc-600 text-zinc-100 text-2xl font-bold tabular-nums"
              />
            ) : (
              <button
                onClick={() => !timerRunning && startEditingTimer()}
                className="hover:bg-zinc-800/60 rounded-md px-2 -mx-2 transition-all text-2xl font-bold text-zinc-100 tabular-nums tracking-wide cursor-pointer"
                title="Edit timer"
              >
                {String(timerMinutes).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!timerRunning ? (
            <Button variant="outline" size="sm" onClick={startTimer} disabled={timerMinutes === 0 && timerSecs === 0}>
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
  );
}
