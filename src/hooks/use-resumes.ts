import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';

function useResumeHeaders() {
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

function extractApiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message: string;
    try {
      const body = await res.json();
      message = body.error || `Request failed (${res.status})`;
    } catch {
      message = `Request failed (${res.status})`;
    }
    throw new Error(message);
  }
  return res.json();
}

export interface ResumeData {
  _id: string;
  title: string;
  company: string;
  latexSource: string;
  userEmail: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ResumesResponse {
  dbConnected: boolean;
  data: ResumeData[];
}

export function useResumesQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useResumeHeaders();

  return useQuery<ResumesResponse>({
    queryKey: ['resumes'],
    queryFn: async () => {
      const ts = Date.now();
      const res = await fetch(`/api/db/resumes?userEmail=${encodeURIComponent(userEmail)}&_=${ts}`, { headers: getHeaders() });
      return handleResponse<ResumesResponse>(res);
    },
    enabled: !!userEmail,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
}

export function useSaveResume() {
  const getHeaders = useResumeHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, company, latexSource }: { id?: string; title: string; company?: string; latexSource: string }) => {
      const res = await fetch('/api/db/resumes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ id, title, company, latexSource }),
      });
      return handleResponse<{ success: boolean; data: ResumeData }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}

export function useDeleteResume() {
  const getHeaders = useResumeHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/db/resumes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}
