'use client';

import { ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface PillarDomain {
  name: string;
  progress: number;
}

export interface PillarRowData {
  name: string;
  slug: string;
  progress: number;
  hours: number;
  difficulty: string;
  domains?: PillarDomain[];
}

interface RoadmapCardRowProps {
  pillar: PillarRowData;
  href: string;
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Easy-Medium': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Medium-Hard': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Hard: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function RoadmapCardRow({ pillar, href }: RoadmapCardRowProps) {
  return (
    <Link href={href} className="block">
      <div className="group flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 transition-all hover:border-zinc-700 hover:bg-zinc-900">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-50 transition-colors truncate">
              {pillar.name}
            </h3>
            <Badge
              variant="secondary"
              className={cn('text-[10px] font-medium border shrink-0', difficultyColors[pillar.difficulty] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30')}
            >
              {pillar.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              {pillar.hours}h
            </div>
          </div>
          {pillar.domains && pillar.domains.length > 0 && (
            <div className="flex items-center gap-3 mt-1.5">
              {pillar.domains.slice(0, 3).map((d) => (
                <span key={d.name} className="text-[11px] text-zinc-500">
                  {d.name}: <span className="text-zinc-400 font-medium">{d.progress}%</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="w-36 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-500">Progress</span>
            <span className="text-xs font-semibold text-zinc-300">{pillar.progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${pillar.progress}%` }}
            />
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-zinc-300 shrink-0" />
      </div>
    </Link>
  );
}
