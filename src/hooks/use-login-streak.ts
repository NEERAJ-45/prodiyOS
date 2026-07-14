import { useQuery } from '@tanstack/react-query';

interface LoginStreakResponse {
  streak: number;
  totalLoginDays: number;
}

export function useLoginStreakQuery() {
  return useQuery<LoginStreakResponse>({
    queryKey: ['login-streak'],
    queryFn: async () => {
      const res = await fetch('/api/auth/login-streak');
      if (!res.ok) throw new Error('Failed to fetch login streak');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
