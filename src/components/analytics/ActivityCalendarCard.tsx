'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const HEATMAP_COLORS = ['#1a1a2e', '#0f3b5e', '#1a6b4a', '#2ecc71', '#27ae60'];

function ContributionHeatmap({ dates }: { dates: string[] }) {
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dates.forEach((d) => {
      const key = d.split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [dates]);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setDate(start.getDate() - 6 * 7 - 6);
    start.setHours(0, 0, 0, 0);

    const cells: { date: string; count: number; day: number }[] = [];
    const cur = new Date(start);
    while (cur <= today) {
      const key = cur.toISOString().split('T')[0];
      cells.push({ date: key, count: dayCounts[key] || 0, day: cur.getDay() });
      cur.setDate(cur.getDate() + 1);
    }

    const w: { days: typeof cells }[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push({ days: cells.slice(i, i + 7) });
    }

    const labels: { label: string; index: number }[] = [];
    w.forEach((week, wi) => {
      const firstDate = new Date(week.days[0]?.date || '');
      const month = firstDate.toLocaleString('default', { month: 'short' });
      if (wi === 0 || labels[labels.length - 1]?.label !== month) {
        labels.push({ label: month, index: wi });
      }
    });

    return { weeks: w, monthLabels: labels };
  }, [dayCounts]);

  const maxCount = Math.max(...Object.values(dayCounts), 1);

  const colorForCount = (count: number) => {
    if (count === 0) return HEATMAP_COLORS[0];
    const ratio = count / maxCount;
    if (ratio < 0.25) return HEATMAP_COLORS[1];
    if (ratio < 0.5) return HEATMAP_COLORS[2];
    if (ratio < 0.75) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  };

  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex text-[10px] text-zinc-500 mb-1" style={{ paddingLeft: 32 }}>
          {monthLabels.map((m) => (
            <div key={m.label} style={{ marginLeft: m.index * 14 }}>{m.label}</div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] pr-1.5 pt-0.5">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[10px] text-[9px] text-zinc-500 leading-[10px]">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const cell = week.days[dayIdx];
                if (!cell) return <div key={dayIdx} className="h-[10px] w-[10px]" />;
                return (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-[10px] w-[10px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-zinc-400"
                        style={{ backgroundColor: colorForCount(cell.count) }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs px-2 py-1">
                      {cell.count} completion{cell.count !== 1 ? 's' : ''} on {cell.date}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 justify-end text-[10px] text-zinc-500">
          <span>Less</span>
          {HEATMAP_COLORS.map((c) => (
            <div key={c} className="h-[10px] w-[10px] rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityCalendarCard({ dates, loading }: { dates: string[]; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-card/50 border-zinc-800">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-sm font-medium">Activity Calendar</CardTitle>
            <span className="ml-auto text-[11px] text-muted-foreground">Last 7 weeks</span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {loading ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
          ) : (
            <ContributionHeatmap dates={dates} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
