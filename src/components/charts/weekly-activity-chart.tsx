'use client';

import { useMemo } from 'react';
import { barY, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { Chart } from '@tanstack/charts/react';
import { tooltip } from '@tanstack/charts/tooltip';
import { buildWeeklyActivity } from '@/lib/analytics-charts';
import { DARK_CHART_THEME } from './chart-theme';

export function WeeklyActivityChart({ dates }: { dates: string[] }) {
  const rows = useMemo(() => buildWeeklyActivity(dates, new Date()), [dates]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: 'label',
            y: 'value',
            radius: { end: 4 },
            fill: '#6366f1',
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand<string>().padding(0.28),
            axis: {
              line: false,
              ticks: { size: 0 },
              tickLabels: { thin: false, fontSize: 10 },
            },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: {
              line: false,
              ticks: { count: 3 },
              tickLabels: { fontSize: 10 },
            },
          },
        },
        theme: DARK_CHART_THEME,
        svgAnimation: true,
        tooltip: {
          use: tooltip,
          format: (point) =>
            `${point.datum.value} completion${point.datum.value === 1 ? '' : 's'} in week of ${point.datum.label}`,
        },
      }),
    [rows],
  );

  return (
    <Chart
      definition={definition}
      height={180}
      initialWidth={420}
      ariaLabel="Completions per week over the last eight weeks"
    />
  );
}
