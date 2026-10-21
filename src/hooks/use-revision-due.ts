import { useMemo } from 'react';
import { useRevisionsQuery } from '@/hooks/use-revision';
import { isDue } from '@/lib/revision-scheduler';

/**
 * Count of revision items currently due (dueDate <= today).
 * Mounts the shared ['revisions'] query; safe to call from
 * sidebar, command center, and the revision page simultaneously.
 */
export function useRevisionDueCount(): number {
  const { data } = useRevisionsQuery();
  return useMemo(
    () => (data?.data ?? []).filter((item) => isDue(item)).length,
    [data],
  );
}
