'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export interface DocData {
  _id?: string;
  id: string;
  title: string;
  category: string;
  status: 'TO_READ' | 'READING' | 'COMPLETED' | 'REFERENCE';
  progress: number;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'md';
  fileName: string;
  userEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DocStatus = DocData['status'];
export const DOC_STATUSES: DocStatus[] = ['TO_READ', 'READING', 'COMPLETED', 'REFERENCE'];

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  TO_READ: 'To Read',
  READING: 'Reading',
  COMPLETED: 'Completed',
  REFERENCE: 'Reference',
};

function getHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export function useDocsQuery() {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<{ docs: DocData[] }>({
    queryKey: ['docs', userEmail],
    queryFn: async () => {
      const res = await fetch(`/api/db/docs?userEmail=${encodeURIComponent(userEmail!)}`, {
        headers: getHeaders(customDbUrl),
      });
      if (!res.ok) throw new Error('Failed to fetch docs');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddDoc() {
  const { customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docData: Omit<DocData, 'id' | 'userEmail'>) => {
      const res = await fetch('/api/db/docs', {
        method: 'POST',
        headers: getHeaders(customDbUrl),
        body: JSON.stringify(docData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add doc');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['doc-search'] });
    },
  });
}

export function useUpdateDoc() {
  const { customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DocData> & { id: string }) => {
      const res = await fetch(`/api/db/docs?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getHeaders(customDbUrl),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update doc');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
  });
}

export function useDeleteDoc() {
  const { customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/db/docs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(customDbUrl),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete doc');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['doc-search'] });
    },
  });
}
