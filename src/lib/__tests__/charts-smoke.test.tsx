import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityHeatmap } from '@/components/charts/activity-heatmap';
import { WeeklyActivityChart } from '@/components/charts/weekly-activity-chart';
import { CategoryProgressChart } from '@/components/charts/category-progress-chart';
import { AtsCriteriaChart, AtsScoreGauge } from '@/components/charts/ats-charts';

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

const DATES = [
  new Date(2026, 9, 21, 12).toISOString(),
  new Date(2026, 9, 20, 12).toISOString(),
];

const SCORES = {
  atsScore: 82,
  matchScore: 74,
  structure: 90,
  keywords: 70,
  actionVerbs: 65,
  quantifiableImpact: 55,
  length: 88,
  contactInfo: 100,
};

describe('TanStack chart components', () => {
  it('renders the activity heatmap cells', () => {
    const { container } = render(<ActivityHeatmap dates={DATES} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('rect').length).toBeGreaterThanOrEqual(49);
  });

  it('renders the weekly activity bars', () => {
    const { container } = render(<WeeklyActivityChart dates={DATES} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
  });

  it('renders category progress bars as SVG', () => {
    const { container } = render(
      <CategoryProgressChart
        categories={[
          { label: 'Foundation', completed: 10, total: 20, pct: 50, color: '#0ea5e9' },
          { label: 'Backend', completed: 5, total: 20, pct: 25, color: '#f97316' },
        ]}
      />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
  });

  it('renders ATS gauges and criteria bars as SVG', () => {
    const gauge = render(<AtsScoreGauge label="ATS Score" value={82} />);
    const criteria = render(<AtsCriteriaChart scores={SCORES} />);

    expect(gauge.container.querySelector('svg')).not.toBeNull();
    expect(gauge.container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    expect(criteria.container.querySelectorAll('path').length).toBeGreaterThanOrEqual(6);
  });
});
