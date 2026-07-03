import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';

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

interface CompletionsResponse {
  dbConnected: boolean;
  data: Array<{ storagePrefix: string; itemId: string; completedAt: string }>;
}

export function useCompletionsQuery(storagePrefix: string) {
  const { userEmail } = useProfile();
  const getHeaders = useRequestHeaders();

  return useQuery<CompletionsResponse>({
    queryKey: ['completions', storagePrefix],
    queryFn: async () => {
      const res = await fetch(`/api/db/completions?userEmail=${encodeURIComponent(userEmail)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch completions');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useToggleCompletion() {
  const { userEmail } = useProfile();
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storagePrefix, itemId, completedAt, title }: { storagePrefix: string; itemId: string; completedAt?: string; title?: string }) => {
      const res = await fetch('/api/db/completions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ storagePrefix, itemId, completedAt, userEmail, ...(title ? { title } : {}) }),
      });
      if (!res.ok) throw new Error('Failed to save completion');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      const prefix = variables.storagePrefix.replace('-completed', '');
      queryClient.invalidateQueries({ queryKey: ['completions', prefix] });
    },
  });
}
