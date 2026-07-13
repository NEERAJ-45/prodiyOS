import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { fetchRevisions, saveRevision, deleteRevision } from '@/lib/services/revision';
import type { RevisionRecord } from '@/lib/services/revision';

function useRevisionHeaders() {
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

export function useRevisionsQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useRevisionHeaders();

  return useQuery({
    queryKey: ['revisions'],
    queryFn: () => fetchRevisions(userEmail, getHeaders()),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveRevision() {
  const getHeaders = useRevisionHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: RevisionRecord & { userEmail: string }) =>
      saveRevision(item, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
}

export function useDeleteRevision() {
  const getHeaders = useRevisionHeaders();
  const { userEmail } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRevision(id, userEmail, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
}
