import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { fetchNotes, saveNote } from '@/lib/services/notes';
import type { FetchNotesResponse } from '@/lib/services/notes';

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

export function useNotesQuery(storagePrefix: string) {
  const { userEmail } = useProfile();
  const getHeaders = useNotesHeaders();

  return useQuery<FetchNotesResponse>({
    queryKey: ['notes', storagePrefix],
    queryFn: () => fetchNotes(userEmail, getHeaders()),
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
      return saveNote({ storagePrefix, itemId, note, userEmail, itemTitle }, getHeaders());
    },
    onSuccess: (_data, variables) => {
      const prefix = variables.storagePrefix.replace('-notes', '');
      queryClient.invalidateQueries({ queryKey: ['notes', prefix] });
    },
  });
}
