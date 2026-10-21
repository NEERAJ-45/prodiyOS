import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';

interface ActivityItem {
  text: string;
  createdAt: string;
}

interface ActivityResponse {
  activities: ActivityItem[];
}

function useHistoryHeaders() {
  const { customDbUrl } = useProfile();
  return useCallback(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
    return headers;
  }, [customDbUrl]);
}

export function useActivityLogQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useHistoryHeaders();

  return useQuery<ActivityResponse>({
    queryKey: ['activity-log'],
    queryFn: async () => {
      const res = await fetch(`/api/db/activity?limit=200`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch activity log');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClearActivityLog() {
  const { userEmail } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
      };
      const res = await fetch(`/api/db/activity?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to clear activity log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}
