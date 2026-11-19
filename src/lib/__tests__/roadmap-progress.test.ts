import { describe, expect, it } from 'vitest';
import {
  computeCategoryProgress,
  computeRoadmapProgress,
  readCompletedCount,
} from '@/lib/roadmap-progress';

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

const fakeStorage = (entries: Record<string, string>) => ({
  getItem: (key: string) => entries[key] ?? null,
});

describe('readCompletedCount', () => {
  it('counts completed entries', () => {
    const s = fakeStorage({ 'os-completed': JSON.stringify({ '1': '2026-01-01', '2': '2026-01-02' }) });
    expect(readCompletedCount(s, 'os-completed')).toBe(2);
  });

  it('returns 0 for missing key', () => {
    expect(readCompletedCount(fakeStorage({}), 'nope')).toBe(0);
  });

  it('returns 0 for invalid JSON', () => {
    const s = fakeStorage({ bad: '{not json' });
    expect(readCompletedCount(s, 'bad')).toBe(0);
  });

  it('returns 0 for non-object JSON', () => {
    const s = fakeStorage({ str: '"hello"', n: '42' });
    expect(readCompletedCount(s, 'str')).toBe(0);
    expect(readCompletedCount(s, 'n')).toBe(0);
  });
});

describe('computeCategoryProgress', () => {
  const categories = [
    { slug: 'sd', storageKeys: ['hld-completed', 'lld-completed'], total: 540 },
    { slug: 'fe', storageKeys: ['js-completed'], total: 73 },
  ];

  it('aggregates multiple keys per category', () => {
    const s = fakeStorage({
      'hld-completed': JSON.stringify({ a: 'x', b: 'y', c: 'z' }),
      'lld-completed': JSON.stringify({ d: 'x' }),
    });
    expect(computeCategoryProgress(categories, s).sd).toBe(1);
  });

  it('computes percentage per category', () => {
    const s = fakeStorage({ 'js-completed': JSON.stringify({ a: 'x' }) });
    expect(computeCategoryProgress(categories, s).fe).toBe(1);
  });

  it('clamps at 100 when custom topics inflate counts', () => {
    const many: Record<string, string> = {};
    for (let i = 0; i < 80; i++) many[String(i)] = 'x';
    const s = fakeStorage({ 'js-completed': JSON.stringify(many) });
    expect(computeCategoryProgress(categories, s).fe).toBe(100);
  });

  it('returns 0 when storage is empty', () => {
    const out = computeCategoryProgress(categories, fakeStorage({}));
    expect(out.sd).toBe(0);
    expect(out.fe).toBe(0);
  });
});
