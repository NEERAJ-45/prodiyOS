/**
 * lib/services/completions.ts
 *
 * Typed fetch wrappers for /api/db/completions.
 *
 * These functions are intentionally pure (no React hooks) so they can be
 * called from server components, service workers, or test files.
 *
 * The existing useCompletionsQuery / useToggleCompletion hooks in
 * src/hooks/use-completions.ts call these endpoints directly with inline
 * fetch; those hooks continue to work unchanged.
 * TODO: migrate use-completions.ts to delegate to these functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompletionRecord {
  storagePrefix: string;
  itemId: string;
  completedAt: string;
}

export interface FetchCompletionsResponse {
  dbConnected: boolean;
  data: CompletionRecord[];
  error?: string;
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

export interface ResetCompletionsRequest {
  storagePrefix: string;
  userEmail: string;
}

export interface ResetCompletionsResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all completions for a user.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function fetchCompletions(
  userEmail: string,
  headers: Record<string, string>,
): Promise<FetchCompletionsResponse> {
  const res = await fetch(
    `/api/db/completions?userEmail=${encodeURIComponent(userEmail)}`,
    { headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchCompletions failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchCompletionsResponse>;
}

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

/**
 * Delete all completions for a given storagePrefix (reset progress).
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function resetCompletions(
  payload: ResetCompletionsRequest,
  headers: Record<string, string>,
): Promise<ResetCompletionsResponse> {
  const res = await fetch('/api/db/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, resetAll: true }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `resetCompletions failed: ${res.status}`,
    );
  }
  return res.json() as Promise<ResetCompletionsResponse>;
}
