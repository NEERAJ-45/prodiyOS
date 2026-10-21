'use client';

import { useMemo } from 'react';
import { cell, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { Chart } from '@tanstack/charts/react';
import { tooltip } from '@tanstack/charts/tooltip';
import { buildHeatmap } from '@/lib/analytics-charts';
import { DARK_CHART_THEME } from './chart-theme';

const HEATMAP_COLORS = ['#1a1a2e', '#0f3b5e', '#1a6b4a', '#2ecc71', '#27ae60'];
const BUCKETS = ['0', '1', '2', '3', '4'];

export function ActivityHeatmap({ dates }: { dates: string[] }) {
  const rows = useMemo(() => {
    const heatmap = buildHeatmap(dates, new Date());
    return heatmap.cells.map((entry) => ({
      ...entry,
      weekLabel: heatmap.weekLabels[entry.week],
      dayLabel: heatmap.dayLabels[entry.day],
    }));
  }, [dates]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          cell(rows, {
            x: 'weekLabel',
            y: 'dayLabel',
            color: 'bucket',
            key: 'date',
            radius: 2,
            inset: 1.5,
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand<string>().padding(0.06),
            axis: {
              line: false,
              ticks: { size: 0 },
              tickLabels: { thin: false, fontSize: 10 },
            },
          },
          y: {
            scale: () => scaleBand<string>().padding(0.08),
            axis: {
              line: false,
              ticks: { size: 0 },
              tickLabels: { thin: false, fontSize: 10 },
            },
          },
        },
        color: { domain: BUCKETS, range: HEATMAP_COLORS },
        theme: DARK_CHART_THEME,
        tooltip: {
          use: tooltip,
          format: (point) =>
            `${point.datum.count} completion${point.datum.count === 1 ? '' : 's'} on ${point.datum.date}`,
        },
      }),
    [rows],
  );

  return (
    <div className="space-y-2">
      <Chart
        definition={definition}
        height={168}
        initialWidth={620}
        ariaLabel="Activity calendar for the last seven weeks"
      />
      <div className="flex items-center gap-1 justify-end text-[10px] text-zinc-500">
        <span>Less</span>
        {HEATMAP_COLORS.map((color) => (
          <div key={color} className="h-[10px] w-[10px] rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
