/**
 * lib/services/custom-topics.ts
 *
 * Typed fetch wrappers for /api/db/custom-topics.
 *
 * use-custom-topics.ts delegates to these functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomTopicRecord {
  id: number;
  title: string;
  difficulty: string;
  link: string;
  storagePrefix: string;
}

export interface AddCustomTopicRequest {
  storagePrefix: string;
  id: number;
  title: string;
  difficulty: string;
  link: string;
  userEmail: string;
}

export interface AddCustomTopicResponse {
  success: boolean;
  data?: CustomTopicRecord;
  error?: string;
}

export interface DeleteCustomTopicResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Add a new custom topic (upsert by id + storagePrefix).
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function addCustomTopic(
  payload: AddCustomTopicRequest,
  headers: Record<string, string>,
): Promise<AddCustomTopicResponse> {
  const res = await fetch('/api/db/custom-topics', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `addCustomTopic failed: ${res.status}`,
    );
  }
  return res.json() as Promise<AddCustomTopicResponse>;
}

/**
 * Delete a single custom topic by id + storagePrefix.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function deleteCustomTopic(
  storagePrefix: string,
  id: number,
  userEmail: string,
  headers: Record<string, string>,
): Promise<DeleteCustomTopicResponse> {
  const res = await fetch(
    `/api/db/custom-topics?storagePrefix=${encodeURIComponent(storagePrefix)}&id=${id}&userEmail=${encodeURIComponent(userEmail)}`,
    {
      method: 'DELETE',
      headers,
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `deleteCustomTopic failed: ${res.status}`,
    );
  }
  return res.json() as Promise<DeleteCustomTopicResponse>;
}
