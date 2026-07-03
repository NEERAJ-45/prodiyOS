'use client';

/**
 * Shared hook: builds the standard API request-headers object.
 *
 * Extracted from the three inline `useRequestHeaders` / `useNotesHeaders` /
 * `useTopicsHeaders` functions that were previously copy-pasted into
 * use-completions.ts, use-notes.ts, and use-custom-topics.ts.
 *
 * Usage:
 *   const getHeaders = useRequestHeaders();
 *   fetch('/api/db/...', { headers: getHeaders() });
 */

import { useCallback } from 'react';
import { useProfile } from '@/components/providers/ProfileProvider';

export function useRequestHeaders() {
  const { userEmail, customDbUrl } = useProfile();

  return useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
    };
    if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
    return headers;
  }, [userEmail, customDbUrl]);
}
