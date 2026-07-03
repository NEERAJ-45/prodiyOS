import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';

function useTopicsHeaders() {
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

interface CustomTopicsResponse {
  dbConnected: boolean;
  data: Array<{ id: number; title: string; difficulty: string; link: string; storagePrefix: string }>;
}

export function useCustomTopicsQuery(storagePrefix: string) {
  const { userEmail } = useProfile();
  const getHeaders = useTopicsHeaders();

  return useQuery<CustomTopicsResponse>({
    queryKey: ['custom-topics', storagePrefix],
    queryFn: async () => {
      const res = await fetch(`/api/db/custom-topics?userEmail=${encodeURIComponent(userEmail)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch custom topics');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddCustomTopic() {
  const { userEmail } = useProfile();
  const getHeaders = useTopicsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storagePrefix, id, title, difficulty, link }: { storagePrefix: string; id: number; title: string; difficulty: string; link: string }) => {
      const res = await fetch('/api/db/custom-topics', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ storagePrefix, id, title, difficulty, link, userEmail }),
      });
      if (!res.ok) throw new Error('Failed to add custom topic');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-topics', variables.storagePrefix] });
    },
  });
}

export function useDeleteCustomTopic() {
  const { userEmail } = useProfile();
  const getHeaders = useTopicsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storagePrefix, id }: { storagePrefix: string; id: number }) => {
      const res = await fetch(`/api/db/custom-topics?storagePrefix=${storagePrefix}&id=${id}&userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete custom topic');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-topics', variables.storagePrefix] });
    },
  });
}
