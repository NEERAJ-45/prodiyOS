export function readCompletedCount(
  storage: Pick<Storage, 'getItem'>,
  storageKey: string,
): number {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return 0;
    return Object.keys(data).length;
  } catch {
    return 0;
  }
}

export function computeCategoryProgress(
  categories: { slug: string; storageKeys: string[]; total: number }[],
  storage: Pick<Storage, 'getItem'>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cat of categories) {
    const done = cat.storageKeys.reduce(
      (sum, key) => sum + readCompletedCount(storage, key),
      0,
    );
    out[cat.slug] =
      cat.total > 0 ? Math.min(100, Math.round((done / cat.total) * 100)) : 0;
  }
  return out;
}
