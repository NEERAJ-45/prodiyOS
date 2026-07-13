import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import type { CustomQAParsedData } from '@/lib/parsers';

function useRequestHeaders() {
  const { userEmail, customDbUrl } = useProfile();
  return useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
    };
    if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
    return headers;
  }, [userEmail, customDbUrl]);
}

export interface CustomQABook {
  slug: string;
  title: string;
  totalQuestions: number;
  sections: Array<{
    id: string;
    title: string;
    questions: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
  }>;
}

interface CustomQAResponse {
  dbConnected: boolean;
  data: {
    activeBookSlug: string;
    books: CustomQABook[];
  } | null;
  progress: Record<string, { mastered: boolean; flagged: boolean }>;
}

export function useCustomQAQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useRequestHeaders();

  return useQuery<CustomQAResponse>({
    queryKey: ['custom-qa'],
    queryFn: async () => {
      const res = await fetch(`/api/db/custom-qa?userEmail=${encodeURIComponent(userEmail)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch Custom Q&A');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

export function useSaveCustomQA() {
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomQAParsedData) => {
      const res = await fetch('/api/db/custom-qa', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'save_data', data }),
      });
      if (!res.ok) throw new Error('Failed to save Custom Q&A');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-qa'] });
    },
  });
}

export function useSaveCustomQAProgress() {
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: Record<string, { mastered: boolean; flagged: boolean }>) => {
      const res = await fetch('/api/db/custom-qa', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'save_progress', progress }),
      });
      if (!res.ok) throw new Error('Failed to save Custom Q&A progress');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-qa'] });
    },
  });
}

export function useSelectCustomQABook() {
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch('/api/db/custom-qa', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'select_book', slug }),
      });
      if (!res.ok) throw new Error('Failed to select subject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-qa'] });
    },
  });
}

export function useDeleteCustomQABook() {
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch('/api/db/custom-qa', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'delete_book', slug }),
      });
      if (!res.ok) throw new Error('Failed to delete subject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-qa'] });
    },
  });
}

export function useClearCustomQA() {
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/db/custom-qa', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'clear' }),
      });
      if (!res.ok) throw new Error('Failed to clear Custom Q&A');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-qa'] });
    },
  });
}
