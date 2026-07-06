'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export function useOnboardingStatus(email: string) {
  return useQuery({
    queryKey: ['onboarding', email],
    queryFn: async () => {
      if (!email) return { onboarded: true, onboardingData: null };
      const res = await fetch(`/api/db/onboarding?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to fetch onboarding status');
      return res.json();
    },
    enabled: !!email,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ email, onboardingData }: { email: string; onboardingData: any }) => {
      const res = await fetch('/api/db/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, onboardingData }),
      });
      if (!res.ok) throw new Error('Failed to save onboarding');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', variables.email] });
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(variables.onboardingData));
    },
  });
}
