'use client';

import { useMemo } from 'react';
import { barX, defineChart } from '@tanstack/charts';
import { pie, polar, radialArc, radialText } from '@tanstack/charts/polar';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { Chart } from '@tanstack/charts/react';
import { tooltip } from '@tanstack/charts/tooltip';
import type { AnalysisScores } from '@/hooks/use-resume-analyses';
import { DARK_CHART_THEME } from './chart-theme';

const CRITERIA: { key: keyof AnalysisScores; label: string }[] = [
  { key: 'structure', label: 'Structure' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'actionVerbs', label: 'Action Verbs' },
  { key: 'quantifiableImpact', label: 'Impact' },
  { key: 'length', label: 'Length' },
  { key: 'contactInfo', label: 'Contact' },
];

function scoreColor(value: number): string {
  if (value >= 80) return '#10b981';
  if (value >= 60) return '#f59e0b';
  return '#ef4444';
}

export function AtsScoreGauge({ label, value }: { label: string; value: number }) {
  const definition = useMemo(() => {
    const score = Math.max(0, Math.min(100, Math.round(value)));
    const reading = { id: 'score', value: score } as const;
    const parts = [reading, { id: 'remaining', value: 100 - score }] as const;
    const slices = pie(parts, {
      value: 'value',
      startAngle: -Math.PI * 0.75,
      endAngle: Math.PI * 0.75,
    });
    const color = scoreColor(score);

    return defineChart({
      marks: [
        polar({
          radiusRatio: 0.88,
          scales: {
            angle: { scale: scaleLinear().domain([0, 1]) },
            radius: { scale: scaleLinear().domain([0, 1]) },
          },
          marks: [
            radialArc(slices, {
              innerRadius: ({ radius }) => radius * 0.72,
              cornerRadius: 999,
              color: 'id',
              key: 'id',
            }),
            radialText([reading], {
              angle: 0,
              radius: 0,
              text: (row) => `${row.value}%`,
              key: 'id',
              fill: color,
              fontSize: 18,
              fontWeight: 700,
            }),
          ],
        }),
      ],
      scales: { x: null, y: null },
      color: { domain: ['score', 'remaining'], range: [color, 'rgba(255,255,255,0.08)'] },
      focus: false,
    });
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <Chart definition={definition} width={104} height={104} ariaLabel={`${label}: ${value}%`} />
      <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function AtsCriteriaChart({ scores }: { scores: AnalysisScores }) {
  const rows = useMemo(
    () => CRITERIA.map((criterion) => ({
      label: criterion.label,
      value: scores[criterion.key] ?? 0,
    })),
    [scores],
  );
  const labels = useMemo(() => rows.map((row) => row.label), [rows]);
  const colors = useMemo(() => rows.map((row) => scoreColor(row.value)), [rows]);

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barX(rows, {
            x: 'value',
            y: 'label',
            color: 'label',
            radius: { end: 4 },
            maxThickness: 8,
          }),
        ],
        scales: {
          x: {
            scale: scaleLinear().domain([0, 100]),
            grid: true,
            axis: {
              line: false,
              ticks: { count: 5 },
              tickLabels: { fontSize: 10 },
            },
          },
          y: {
            scale: () => scaleBand<string>().padding(0.26),
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
          format: (point) => `${point.datum.label}: ${point.datum.value}/100`,
        },
      }),
    [colors, labels, rows],
  );

  return (
    <Chart
      definition={definition}
      height={220}
      initialWidth={420}
      ariaLabel="Resume score by ATS criterion"
    />
  );
}
