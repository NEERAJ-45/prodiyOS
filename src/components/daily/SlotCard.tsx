'use client';

import { CheckCircle2, Circle, Brain, BookOpen, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type Slot, getRoadmapLink } from '@/data/schedules';
import { LinkBadge } from './LinkBadge';

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

interface SlotCardProps {
  slot: Slot;
  isDone: boolean;
  slotNote: string;
  onToggle: () => void;
  onNoteChange: (text: string) => void;
}

export function SlotCard({ slot, isDone, slotNote, onToggle, onNoteChange }: SlotCardProps) {
  const SlotIcon = SLOT_ICONS[slot.period] ?? Brain;
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all',
        isDone ? 'border-emerald-500/20 bg-emerald-500/5' : SLOT_COLORS[slot.period],
      )}
    >
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0 cursor-pointer">
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
            <LinkBadge isDone={isDone} roadmapLink={getRoadmapLink(slot.topic, slot.period)} />
          </div>
          {slot.description && (
            <p className="text-[11px] text-zinc-600 mt-0.5">{slot.description}</p>
          )}
          <div className="mt-2">
            <textarea
              value={slotNote}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="What did you study? Wins, struggles..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md p-2 text-xs text-zinc-400 outline-none resize-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600 h-14"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
