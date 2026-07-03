import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';

function useNotesHeaders() {
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

interface NotesResponse {
  dbConnected: boolean;
  data: Array<{ storagePrefix: string; itemId: string; note: string }>;
}

export function useNotesQuery(storagePrefix: string) {
  const { userEmail } = useProfile();
  const getHeaders = useNotesHeaders();

  return useQuery<NotesResponse>({
    queryKey: ['notes', storagePrefix],
    queryFn: async () => {
      const res = await fetch(`/api/db/notes?userEmail=${encodeURIComponent(userEmail)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveNote() {
  const { userEmail } = useProfile();
  const getHeaders = useNotesHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storagePrefix, itemId, note, itemTitle }: { storagePrefix: string; itemId: string; note?: string; itemTitle?: string }) => {
      const res = await fetch('/api/db/notes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ storagePrefix, itemId, note, userEmail, itemTitle }),
      });
      if (!res.ok) throw new Error('Failed to save note');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      const prefix = variables.storagePrefix.replace('-notes', '');
      queryClient.invalidateQueries({ queryKey: ['notes', prefix] });
    },
  });
}
