'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS } from '@/lib/storage-keys';

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
