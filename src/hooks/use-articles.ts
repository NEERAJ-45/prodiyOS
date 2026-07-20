'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface ArticleCodeFile {
  name: string;
  language: string;
  content: string;
}

export interface ArticleAsset {
  name: string;
  mimeType: string;
  data: string;
}

export interface ArticleData {
  _id?: string;
  id: string;
  title: string;
  content: string;
  userEmail?: string;
  codeFiles: ArticleCodeFile[];
  assets: ArticleAsset[];
  createdAt?: string;
  updatedAt?: string;
}

function getHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export function useArticlesQuery() {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<{ articles: ArticleData[] }>({
    queryKey: ['articles', userEmail],
    queryFn: async () => {
      const res = await fetch(`/api/db/articles?userEmail=${encodeURIComponent(userEmail!)}`, {
        headers: getHeaders(customDbUrl),
      });
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveArticle() {
  const { userEmail, customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      title: string;
      content: string;
      codeFiles?: ArticleCodeFile[];
      assets?: ArticleAsset[];
    }) => {
      const res = await fetch('/api/db/articles', {
        method: 'POST',
        headers: getHeaders(customDbUrl),
        body: JSON.stringify({ ...data, userEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save article');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDeleteArticle() {
  const { userEmail, customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/db/articles?id=${encodeURIComponent(id)}&userEmail=${encodeURIComponent(userEmail!)}`, {
        method: 'DELETE',
        headers: getHeaders(customDbUrl),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete article');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
