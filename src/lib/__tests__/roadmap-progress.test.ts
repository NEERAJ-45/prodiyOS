import { describe, expect, it } from 'vitest';
import { computeRoadmapProgress } from '@/lib/roadmap-progress';

const CATEGORIES = [
  {
    slug: 'foundation',
    total: 150,
    storageKeys: ['foundation-os-completed', 'foundation-dbms-completed', 'foundation-cn-completed'],
  },
];

const noLocal = () => [];

describe('computeRoadmapProgress', () => {
  it('computes progress from DB rows without any localStorage entries', () => {
    const rows = [
      { storagePrefix: 'foundation-os-completed', itemId: '1' },
      { storagePrefix: 'foundation-os-completed', itemId: '2' },
      { storagePrefix: 'foundation-os-completed', itemId: '3' },
    ];

    expect(computeRoadmapProgress(CATEGORIES, rows, noLocal)).toEqual({ foundation: 2 });
  });

  it('merges DB rows with local completions without double counting', () => {
    const rows = [{ storagePrefix: 'foundation-os-completed', itemId: '1' }];
    const local = (key: string) =>
      key === 'foundation-os-completed' ? ['1', '2'] : [];

    expect(computeRoadmapProgress(CATEGORIES, rows, local)).toEqual({ foundation: 1 });
  });

  it('ignores rows from other storage prefixes', () => {
    const rows = [{ storagePrefix: 'frontend-react-completed', itemId: '99' }];

    expect(computeRoadmapProgress(CATEGORIES, rows, noLocal)).toEqual({ foundation: 0 });
  });

  it('clamps progress at 100 percent', () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({
      storagePrefix: 'foundation-os-completed',
      itemId: String(i),
    }));

    expect(computeRoadmapProgress(CATEGORIES, rows, noLocal)).toEqual({ foundation: 100 });
  });
});
