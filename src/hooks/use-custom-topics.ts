import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { fetchCustomTopics, addCustomTopic, deleteCustomTopic } from '@/lib/services/custom-topics';
import type { FetchCustomTopicsResponse } from '@/lib/services/custom-topics';

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

export function useCustomTopicsQuery(storagePrefix: string) {
  const { userEmail } = useProfile();
  const getHeaders = useTopicsHeaders();

  return useQuery<FetchCustomTopicsResponse>({
    queryKey: ['custom-topics', storagePrefix],
    queryFn: () => fetchCustomTopics(userEmail, getHeaders()),
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
      return addCustomTopic({ storagePrefix, id, title, difficulty, link, userEmail }, getHeaders());
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
      return deleteCustomTopic(storagePrefix, id, userEmail, getHeaders());
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-topics', variables.storagePrefix] });
    },
  });
}
