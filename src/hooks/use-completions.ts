import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { toggleCompletion } from '@/lib/services/completions';

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

export function useToggleCompletion() {
  const { userEmail } = useProfile();
  const getHeaders = useRequestHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storagePrefix, itemId, completedAt, title }: { storagePrefix: string; itemId: string; completedAt?: string; title?: string }) => {
      return toggleCompletion({ storagePrefix, itemId, completedAt, title, userEmail }, getHeaders());
    },
    onSuccess: (_data, variables) => {
      const prefix = variables.storagePrefix.replace('-completed', '');
      queryClient.invalidateQueries({ queryKey: ['completions', prefix] });
    },
  });
}
