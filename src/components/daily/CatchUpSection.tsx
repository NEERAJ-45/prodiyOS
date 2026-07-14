'use client';

import { CheckCircle2, Circle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type Slot } from '@/data/schedules';
import { LinkBadge } from './LinkBadge';
import { getRoadmapLink } from '@/data/schedules';

interface MissedSlot {
  date: string;
  dayName: string;
  slot: Slot;
}

export function CatchUpSection({
  missed,
  showCatchUp,
  onToggleSection,
  onToggleSlot,
  getSlotCompletion,
}: {
  missed: MissedSlot[];
  showCatchUp: boolean;
  onToggleSection: () => void;
  onToggleSlot: (dateKey: string, period: string) => void;
  getSlotCompletion: (dateKey: string, period: string) => boolean;
}) {
  if (missed.length === 0) return null;

  return (
    <Card className="bg-card/50 border-amber-500/20">
      <CardHeader className="p-4 pb-3 cursor-pointer select-none" onClick={onToggleSection}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-medium text-zinc-200">
              Catch-up ({missed.length} missed slots)
            </CardTitle>
          </div>
          {showCatchUp ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
        </div>
      </CardHeader>
      {showCatchUp && (
        <CardContent className="p-4 pt-1 space-y-2">
          {missed.map((m) => {
            const isNowDone = getSlotCompletion(m.date, m.slot.period);
            return (
              <div
                key={`${m.date}-${m.slot.period}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-2.5 transition-all',
                  isNowDone
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-zinc-800 bg-zinc-900/30',
                )}
              >
                <button onClick={() => onToggleSlot(m.date, m.slot.period)} className="shrink-0 cursor-pointer">
                  {isNowDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-600 hover:text-zinc-400 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-500">{m.dayName} {m.date.slice(5)}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-zinc-500 border-zinc-700">
                      {m.slot.period}
                    </Badge>
                    <span className={cn('text-xs', isNowDone ? 'text-zinc-500 line-through' : 'text-zinc-300')}>
                      {m.slot.topic}
                    </span>
                    <LinkBadge isDone={isNowDone} roadmapLink={getRoadmapLink(m.slot.topic, m.slot.period)} />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
