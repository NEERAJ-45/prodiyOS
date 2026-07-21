'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface BookmarkData {
  _id?: string;
  id: string;
  bookId: string;
  pageNumber: number;
  note?: string;
  userEmail?: string;
  createdAt?: string;
}

function loadLocalBookmarks(bookId: string): BookmarkData[] {
  try {
    const raw = localStorage.getItem(`bookmarks-${bookId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookmarks(bookId: string, bookmarks: BookmarkData[]) {
  localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(bookmarks));
}

function getHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export function useBookmarksQuery(bookId: string | undefined) {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<BookmarkData[]>({
    queryKey: ['bookmarks', bookId],
    queryFn: async () => {
      if (!bookId) return [];

      const local = loadLocalBookmarks(bookId);
      const localMap = new Map(local.map((b) => [b.id, b]));

      try {
        const res = await fetch(
          `/api/db/bookmarks?bookId=${encodeURIComponent(bookId)}&userEmail=${encodeURIComponent(userEmail!)}`,
          { headers: getHeaders(customDbUrl) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.bookmarks) {
            const merged = new Map(localMap);
            for (const b of data.bookmarks) {
              merged.set(b.id, b);
            }
            const mergedArr = Array.from(merged.values());
            saveLocalBookmarks(bookId, mergedArr);
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

export function useAddBookmark() {
  const { userEmail, customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookmark: Omit<BookmarkData, 'id' | 'createdAt' | '_id'>) => {
      const bookId = bookmark.bookId;
      const local = loadLocalBookmarks(bookId);

      const existing = local.find((b) => b.pageNumber === bookmark.pageNumber);
      if (existing) return existing;

      const newBookmark: BookmarkData = {
        ...bookmark,
        id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      local.push(newBookmark);
      saveLocalBookmarks(bookId, local);
      queryClient.setQueryData(['bookmarks', bookId], local);

      try {
        await fetch('/api/db/bookmarks', {
          method: 'POST',
          headers: { ...getHeaders(customDbUrl), 'x-user-email': userEmail! },
          body: JSON.stringify({ ...newBookmark, userEmail }),
        });
      } catch {}

      return newBookmark;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', variables.bookId] });
    },
  });
}

export function useDeleteBookmark() {
  const { userEmail, customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      const local = loadLocalBookmarks(bookId);
      const filtered = local.filter((b) => b.id !== id);
      saveLocalBookmarks(bookId, filtered);
      queryClient.setQueryData(['bookmarks', bookId], filtered);

      try {
        await fetch(`/api/db/bookmarks?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { ...getHeaders(customDbUrl), 'x-user-email': userEmail! },
        });
      } catch {}

      return { id, bookId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', variables.bookId] });
    },
  });
}
