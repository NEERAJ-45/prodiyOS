'use client';

import { useId, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface ActivityPoint {
  date: string;
  solved: number;
}

const W = 692;
const H = 168;
const PAD = { left: 28, right: 8, top: 10, bottom: 10 };

const round = (value: number) => Math.round(value * 10) / 10;

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function buildPoints(values: number[], maxValue: number) {
  const plotWidth = W - PAD.left - PAD.right;
  const plotHeight = H - PAD.top - PAD.bottom;
  const step = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: PAD.left + index * step,
    y: H - PAD.bottom - (value / maxValue) * plotHeight,
  }));
}

function smoothPath(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += ` C ${round(p1.x + (p2.x - p0.x) / 6)} ${round(p1.y + (p2.y - p0.y) / 6)} ${round(
      p2.x - (p3.x - p1.x) / 6,
    )} ${round(p2.y - (p3.y - p1.y) / 6)} ${round(p2.x)} ${round(p2.y)}`;
  }
  return d;
}

export function ActivityChart({ series }: { series: ActivityPoint[] }) {
  const gradientId = useId().replace(/:/g, '');
  const [active, setActive] = useState<number | null>(null);

  const solved = useMemo(() => series.map((point) => point.solved), [series]);
  const average = useMemo(
    () =>
      solved.map((_, index) => {
        const window = solved.slice(Math.max(0, index - 6), index + 1);
        return window.reduce((sum, value) => sum + value, 0) / window.length;
      }),
    [solved],
  );

  const maxValue = useMemo(() => {
    const peak = Math.max(1, ...solved, ...average);
    const step = Math.max(4, Math.ceil(peak / 3 / 4) * 4);
    return step * 3;
  }, [solved, average]);

  const solvedPoints = useMemo(() => buildPoints(solved, maxValue), [solved, maxValue]);
  const averagePoints = useMemo(() => buildPoints(average, maxValue), [average, maxValue]);
  const solvedLine = useMemo(() => smoothPath(solvedPoints), [solvedPoints]);
  const averageLine = useMemo(() => smoothPath(averagePoints), [averagePoints]);

  const areaFill = useMemo(() => {
    if (!solvedPoints.length) return '';
    const first = solvedPoints[0];
    const last = solvedPoints[solvedPoints.length - 1];
    const bottom = H - PAD.bottom;
    return `${solvedLine} L ${round(last.x)} ${bottom} L ${round(first.x)} ${bottom} Z`;
  }, [solvedLine, solvedPoints]);

  const lastIndex = series.length - 1;
  const markerIndex = active ?? Math.max(0, lastIndex);
  const marker = solvedPoints[markerIndex];
  const labels = series.map((point) => formatDate(point.date));

  const gridValues = [1, 2, 3].map((step) => Math.round((maxValue / 3) * step));

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (series.length < 2) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const xInViewBox = ((event.clientX - rect.left) / rect.width) * W;
    const ratio = (xInViewBox - PAD.left) / (W - PAD.left - PAD.right);
    const index = Math.round(ratio * (series.length - 1));
    setActive(Math.min(lastIndex, Math.max(0, index)));
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive(Math.min(lastIndex, (active ?? -1) + 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive(Math.max(0, (active ?? lastIndex + 1) - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(lastIndex);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  };

  if (!series.length) {
    return (
      <p className="flex h-[168px] items-center justify-center text-sm text-zinc-500">
        No activity recorded yet. Complete a problem to start the chart.
      </p>
    );
  }

  const tooltipLeft = Math.min(86, Math.max(14, (marker.x / W) * 100));
  const tooltipTop = Math.max(18, (marker.y / H) * 100);
  const ariaLabel = `Problem activity, last ${series.length} days. Solved today: ${
    series[lastIndex].solved
  }. Use arrow keys to inspect each day.`;

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none rounded-md outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          role="img"
          tabIndex={0}
          aria-label={ariaLabel}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
          onKeyDown={handleKeyDown}
          onBlur={() => setActive(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d6d6d6" stopOpacity="0.16" />
              <stop offset="1" stopColor="#d6d6d6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((value) => {
            const y = H - PAD.bottom - (value / maxValue) * (H - PAD.top - PAD.bottom);
            return (
              <g key={value}>
                <line x1={6} y1={y} x2={W - 2} y2={y} stroke="#262626" strokeWidth={1} />
                <text x={8} y={y - 5} fontSize={9} fill="#8a8a8a">
                  {value}
                </text>
              </g>
            );
          })}

          <path d={areaFill} fill={`url(#${gradientId})`} />
          <path
            d={averageLine}
            fill="none"
            stroke="#8a8a8a"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeLinecap="round"
            opacity={0.85}
          />
          <path d={solvedLine} fill="none" stroke="#d6d6d6" strokeWidth={2.2} strokeLinecap="round" />

          {active !== null && (
            <line
              x1={round(marker.x)}
              y1={PAD.top}
              x2={round(marker.x)}
              y2={H - PAD.bottom}
              stroke="#3a3a3a"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          <circle cx={round(marker.x)} cy={round(marker.y)} r={6.5} fill="#0a0a0a" stroke="#d6d6d6" strokeWidth={2} />
          <circle cx={round(marker.x)} cy={round(marker.y)} r={2.5} fill="#d6d6d6" />
        </svg>

        {active !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-lg border border-zinc-700 bg-[#1a1a1a] px-2.5 py-2"
            style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%` }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              {labels[active]}
            </p>
            <p className="mt-0.5 text-xs text-[#d6d6d6]">
              {series[active].solved} solved · avg {average[active].toFixed(1)}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[11px] text-zinc-500">
        {[0, Math.floor(lastIndex / 3), Math.floor((lastIndex * 2) / 3), lastIndex].map((index) => (
          <span key={index}>{index === lastIndex ? 'Today' : labels[index]}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d6d6d6]" aria-hidden />
          Solved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8a8a8a]" aria-hidden />
          7-day average
        </span>
        <Link
          href="/analytics"
          className="ml-auto flex items-center gap-1 text-[#d6d6d6] transition-opacity hover:opacity-70"
        >
          View analytics
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <table className="sr-only">
        <caption>Problems solved per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Solved</th>
          </tr>
        </thead>
        <tbody>
          {series.map((point) => (
            <tr key={point.date}>
              <th scope="row">{labels[series.indexOf(point)]}</th>
              <td>{point.solved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
