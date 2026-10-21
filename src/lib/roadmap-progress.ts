export interface RoadmapCategoryMeta {
  slug: string;
  total: number;
  storageKeys: string[];
}

export interface CompletionRow {
  storagePrefix: string;
  itemId: string;
}

export type LocalCompletedIdsReader = (storageKey: string) => string[];

export function readLocalCompletedIds(storageKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    return Object.keys(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return [];
  }
}

export function computeRoadmapProgress(
  categories: RoadmapCategoryMeta[],
  rows: CompletionRow[],
  readLocal: LocalCompletedIdsReader = readLocalCompletedIds,
): Record<string, number> {
  const idsByPrefix = new Map<string, Set<string>>();
  for (const row of rows) {
    let ids = idsByPrefix.get(row.storagePrefix);
    if (!ids) {
      ids = new Set<string>();
      idsByPrefix.set(row.storagePrefix, ids);
    }
    ids.add(row.itemId);
  }

  const progress: Record<string, number> = {};
  for (const category of categories) {
    let completed = 0;
    for (const key of category.storageKeys) {
      const merged = new Set<string>(idsByPrefix.get(key) ?? []);
      for (const id of readLocal(key)) merged.add(id);
      completed += merged.size;
    }
    progress[category.slug] =
      category.total > 0 ? Math.min(100, Math.round((completed / category.total) * 100)) : 0;
  }
  return progress;
}
