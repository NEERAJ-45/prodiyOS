'use client';

import { useMemo } from 'react';
import { barX, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { Chart } from '@tanstack/charts/react';
import { tooltip } from '@tanstack/charts/tooltip';
import { DARK_CHART_THEME } from './chart-theme';

export type CategoryProgress = {
  label: string;
  completed: number;
  total: number;
  pct: number;
  color: string;
};

export function CategoryProgressChart({ categories }: { categories: CategoryProgress[] }) {
  const labels = useMemo(() => categories.map((category) => category.label), [categories]);
  const colors = useMemo(() => categories.map((category) => category.color), [categories]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barX(categories, {
            x: 'pct',
            y: 'label',
            color: 'label',
            radius: { end: 4 },
            maxThickness: 10,
          }),
        ],
        scales: {
          x: {
            scale: scaleLinear().domain([0, 100]),
            grid: true,
            axis: {
              line: false,
              ticks: { count: 5, format: (value: number) => `${Math.round(value)}%` },
              tickLabels: { fontSize: 10 },
            },
          },
          y: {
            scale: () => scaleBand<string>().padding(0.28),
            axis: {
              line: false,
              ticks: { size: 0 },
              tickLabels: { thin: false, fontSize: 11 },
            },
          },
        },
        color: { domain: labels, range: colors },
        theme: DARK_CHART_THEME,
        svgAnimation: true,
        tooltip: {
          use: tooltip,
          format: (point) =>
            `${point.datum.label}: ${point.datum.completed}/${point.datum.total} (${point.datum.pct}%)`,
        },
      }),
    [categories, colors, labels],
  );

  return (
    <Chart
      definition={definition}
      height={Math.max(180, categories.length * 32 + 32)}
      initialWidth={420}
      ariaLabel="Completion progress by roadmap category"
    />
  );
}
