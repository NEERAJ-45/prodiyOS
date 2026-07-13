import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { fetchDaily, syncDaily, logActivity } from '@/lib/services/daily';
import type { FetchDailyResponse } from '@/lib/services/daily';

export function useDailyQuery(date: string) {
  const { userEmail } = useProfile();

  return useQuery<FetchDailyResponse>({
    queryKey: ['daily', date],
    queryFn: () => fetchDaily(date),
    enabled: !!userEmail,
    staleTime: 60 * 1000,
  });
}

export function useSyncDaily() {
  const { userEmail } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, completedTaskIds, note }: { date: string; completedTaskIds: string[]; note: string }) => {
      return syncDaily({ date, completedTaskIds, note, userEmail });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily', variables.date] });
    },
  });
}

export function useActivityLog() {
  const { userEmail } = useProfile();

  return useMutation({
    mutationFn: async (text: string) => {
      return logActivity(userEmail, text);
    },
  });
}
