'use client';

import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface DocSearchResult {
  docId: string;
  title: string;
  category: string;
  contentLength: number;
  indexedAt: string;
  score?: number;
}

function getHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export function useDocSearchQuery(q: string, enabled = true) {
  const { customDbUrl } = useProfile();
  const trimmed = q.trim();

  return useQuery<{ results: DocSearchResult[] }>({
    queryKey: ['doc-search', trimmed],
    queryFn: async () => {
      const res = await fetch(`/api/docs/search?q=${encodeURIComponent(trimmed)}`, {
        headers: getHeaders(customDbUrl),
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: enabled && trimmed.length > 0,
    staleTime: 60 * 1000,
  });
}
