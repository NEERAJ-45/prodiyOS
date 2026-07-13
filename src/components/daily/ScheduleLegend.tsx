'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SCHEDULES, type ScheduleId } from '@/data/schedules';

const SCHEDULE_TABS: { id: ScheduleId; label: string; color: string }[] = [
  { id: 'steady', label: 'Steady', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'react', label: 'React', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'java', label: 'Java', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'devops', label: 'DevOps', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'custom', label: 'Custom', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
];

export function ScheduleLegend() {
  return (
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
  );
}
