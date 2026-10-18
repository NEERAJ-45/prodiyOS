import { describe, it, expect } from 'vitest';
import { readCompletedCount, computeCategoryProgress } from '../roadmap-progress';

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
