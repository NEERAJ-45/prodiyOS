import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { fetchCustomRoadmaps, addCustomRoadmap, deleteCustomRoadmap } from '@/lib/services/custom-roadmaps';
import type { FetchCustomRoadmapsResponse } from '@/lib/services/custom-roadmaps';

function useRoadmapHeaders() {
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

export function useCustomRoadmapsQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useRoadmapHeaders();

  return useQuery<FetchCustomRoadmapsResponse>({
    queryKey: ['custom-roadmaps'],
    queryFn: () => fetchCustomRoadmaps(userEmail, getHeaders()),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddCustomRoadmap() {
  const { userEmail } = useProfile();
  const getHeaders = useRoadmapHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      questions: { title: string; difficulty: string; link: string }[];
      color: string;
      hours: number;
      difficulty: string;
    }) => {
      return addCustomRoadmap({ ...payload, userEmail }, getHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roadmaps'] });
    },
  });
}

export function useDeleteCustomRoadmap() {
  const { userEmail } = useProfile();
  const getHeaders = useRoadmapHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug }: { slug: string }) => {
      return deleteCustomRoadmap(slug, userEmail, getHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roadmaps'] });
    },
  });
}
