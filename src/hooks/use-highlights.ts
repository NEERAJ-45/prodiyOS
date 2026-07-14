'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HighlightData {
  _id?: string;
  id: string;
  bookId: string;
  pageNumber: number;
  text: string;
  color: string;
  rects: HighlightRect[];
  userEmail?: string;
  createdAt?: string;
}

function loadLocalHighlights(bookId: string): HighlightData[] {
  try {
    const raw = localStorage.getItem(`highlights-${bookId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHighlights(bookId: string, highlights: HighlightData[]) {
  localStorage.setItem(`highlights-${bookId}`, JSON.stringify(highlights));
}

function getHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export function useHighlightsQuery(bookId: string | undefined) {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<HighlightData[]>({
    queryKey: ['highlights', bookId],
    queryFn: async () => {
      if (!bookId) return [];

      const local = loadLocalHighlights(bookId);
      const localMap = new Map(local.map((h) => [h.id, h]));

      try {
        const res = await fetch(
          `/api/db/highlights?bookId=${encodeURIComponent(bookId)}&userEmail=${encodeURIComponent(userEmail!)}`,
          { headers: getHeaders(customDbUrl) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.highlights) {
            const merged = new Map(localMap);
            for (const h of data.highlights) {
              merged.set(h.id, h);
            }
            const mergedArr = Array.from(merged.values());
            saveLocalHighlights(bookId, mergedArr);
            return mergedArr;
          }
        }
      } catch {}

      return local;
    },
    enabled: !!userEmail && !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddHighlight() {
  const { userEmail, customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlight: Omit<HighlightData, 'id' | 'createdAt' | '_id'>) => {
      const bookId = highlight.bookId;
      const local = loadLocalHighlights(bookId);
      const newHighlight: HighlightData = {
        ...highlight,
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      local.push(newHighlight);
      saveLocalHighlights(bookId, local);
      queryClient.setQueryData(['highlights', bookId], local);

      try {
        await fetch('/api/db/highlights', {
          method: 'POST',
          headers: { ...getHeaders(customDbUrl), 'x-user-email': userEmail! },
          body: JSON.stringify({ ...newHighlight, userEmail }),
        });
      } catch {}

      return newHighlight;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', variables.bookId] });
    },
  });
}

export function useDeleteHighlight() {
  const { userEmail, customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      const local = loadLocalHighlights(bookId);
      const filtered = local.filter((h) => h.id !== id);
      saveLocalHighlights(bookId, filtered);
      queryClient.setQueryData(['highlights', bookId], filtered);

      try {
        await fetch(`/api/db/highlights?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { ...getHeaders(customDbUrl), 'x-user-email': userEmail! },
        });
      } catch {}

      return { id, bookId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['highlights', variables.bookId] });
    },
  });
}
