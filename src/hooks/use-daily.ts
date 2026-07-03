import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

interface DailyRecord {
  completedTaskIds: string[];
  note: string;
}

export function useDailyQuery(date: string) {
  const { userEmail } = useProfile();

  return useQuery<{ record: DailyRecord | null }>({
    queryKey: ['daily', date],
    queryFn: async () => {
      const res = await fetch(`/api/db/daily?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch daily data');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 60 * 1000,
  });
}

export function useSyncDaily() {
  const { userEmail } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, completedTaskIds, note }: { date: string; completedTaskIds: string[]; note: string }) => {
      const res = await fetch('/api/db/daily', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, completedTaskIds, note, userEmail }),
      });
      if (!res.ok) throw new Error('Failed to sync daily data');
      return res.json();
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
      const res = await fetch('/api/db/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, text }),
      });
      if (!res.ok) throw new Error('Failed to log activity');
      return res.json();
    },
  });
}
