/**
 * lib/services/completions.ts
 *
 * Typed fetch wrappers for /api/db/completions.
 *
 * These functions are intentionally pure (no React hooks) so they can be
 * called from server components, service workers, or test files.
 *
 * useToggleCompletion in src/hooks/use-completions.ts delegates to
 * toggleCompletion below.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompletionRecord {
  storagePrefix: string;
  itemId: string;
  completedAt: string;
}

export interface ToggleCompletionRequest {
  storagePrefix: string;
  itemId: string;
  userEmail: string;
  /** Present when marking complete; absent when marking incomplete. */
  completedAt?: string;
  title?: string;
}

export interface ToggleCompletionResponse {
  success: boolean;
  data?: CompletionRecord;
  deleted?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Toggle a single completion (upsert when completedAt is provided, delete otherwise).
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function toggleCompletion(
  payload: ToggleCompletionRequest,
  headers: Record<string, string>,
): Promise<ToggleCompletionResponse> {
  const res = await fetch('/api/db/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `toggleCompletion failed: ${res.status}`,
    );
  }
  return res.json() as Promise<ToggleCompletionResponse>;
}
