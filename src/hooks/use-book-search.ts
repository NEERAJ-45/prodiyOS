'use client';

import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface BookSearchResult {
  bookId: string;
  sourceType: 'library' | 'tracked';
  title: string;
  author: string;
  category: string;
  contentLength: number;
  score?: number;
  indexedAt?: string;
}

export interface BookSearchResponse {
  results: BookSearchResult[];
  query: string;
}

function getHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export function useBookSearchQuery(q: string, sourceType?: string, enabled?: boolean) {
  const { customDbUrl } = useProfile();

  return useQuery<BookSearchResponse>({
    queryKey: ['book-search', q, sourceType],
    queryFn: async () => {
      const params = new URLSearchParams({ q: q.trim() });
      if (sourceType) params.set('sourceType', sourceType);
      const res = await fetch(`/api/books/search?${params}`, {
        headers: getHeaders(customDbUrl),
      });
      if (!res.ok) return { results: [], query: q };
      return res.json();
    },
    enabled: enabled ?? q.trim().length > 0,
    staleTime: 30 * 1000,
  });
}
