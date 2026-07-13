'use client';

import { cn } from '@/lib/utils';
import { SCHEDULES, type ScheduleId } from '@/data/schedules';

const SCHEDULE_TABS: { id: ScheduleId; label: string; color: string }[] = [
  { id: 'steady', label: 'Steady', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'react', label: 'React', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'java', label: 'Java', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'devops', label: 'DevOps', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'custom', label: 'Custom', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
];

export function ScheduleTabs({ scheduleId, onChange }: { scheduleId: ScheduleId; onChange: (id: ScheduleId) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SCHEDULE_TABS.map((tab) => {
        const isActive = scheduleId === tab.id;
        const schedule = SCHEDULES[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
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
  );
}
