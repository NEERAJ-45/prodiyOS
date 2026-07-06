'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface BookData {
  _id?: string;
  id: string;
  title: string;
  author: string;
  status: 'TO_READ' | 'READING' | 'COMPLETED' | 'REFERENCE';
  progress: number;
  rating: number;
  userEmail?: string;
}

export function useBooksQuery() {
  const { userEmail } = useProfile();

  return useQuery<{ books: BookData[] }>({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await fetch(`/api/db/books?userEmail=${userEmail}`);
      if (!res.ok) throw new Error('Failed to fetch books');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 60 * 1000,
  });
}

export function useAddBook() {
  const { userEmail } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookData: Omit<BookData, 'id' | 'userEmail'>) => {
      const res = await fetch('/api/db/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookData, userEmail }),
      });
      if (!res.ok) throw new Error('Failed to add book');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BookData> & { id: string }) => {
      const res = await fetch(`/api/db/books?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update book');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/db/books?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete book');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}
