'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

const STORAGE_KEY = 'reader-access-key';

export class ReaderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) || '';
}

export function storeKey(key: string): void {
  sessionStorage.setItem(STORAGE_KEY, key);
}

function makeHeaders(key: string, customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'x-reader-key': key };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export interface ReaderArticleSummary {
  url: string;
  title: string;
  updatedAt: string;
}

export function useReadArticle() {
  const { customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, url }: { key: string; url: string }) => {
      const res = await fetch('/api/reader/read', {
        method: 'POST',
        headers: { ...makeHeaders(key, customDbUrl), 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, url }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ReaderError(res.status, json.error || 'Something went wrong');
      }
      return json as { title: string; html: string; url: string; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reader-articles'] });
    },
  });
}

export function useReaderArticlesQuery(key: string, q: string) {
  const { customDbUrl } = useProfile();

  return useQuery<{ articles: ReaderArticleSummary[] }>({
    queryKey: ['reader-articles', q],
    queryFn: async () => {
      const res = await fetch(`/api/reader/articles?q=${encodeURIComponent(q)}`, {
        headers: makeHeaders(key, customDbUrl),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ReaderError(res.status, json.error || 'Something went wrong');
      return json;
    },
    enabled: !!key,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReaderArticleQuery(key: string, url: string | null) {
  const { customDbUrl } = useProfile();

  return useQuery<{ article: { url: string; title: string; html: string; updatedAt: string } }>({
    queryKey: ['reader-article', url],
    queryFn: async () => {
      const res = await fetch(`/api/reader/articles?url=${encodeURIComponent(url!)}`, {
        headers: makeHeaders(key, customDbUrl),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ReaderError(res.status, json.error || 'Something went wrong');
      return json;
    },
    enabled: !!key && !!url,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
