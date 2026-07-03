/**
 * lib/services/revision.ts
 *
 * Typed fetch wrappers for /api/db/revision.
 *
 * TODO: migrate revision/page.tsx inline fetch calls to use these functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevisionRecord {
  id: string;
  concept: string;
  stage: number;
  dueDate: string;
  completed: boolean;
  userEmail?: string;
}

export interface FetchRevisionResponse {
  dbConnected: boolean;
  data: RevisionRecord[];
  error?: string;
}

export interface SaveRevisionRequest {
  id: string;
  concept: string;
  stage: number;
  dueDate: string;
  completed?: boolean;
  userEmail: string;
}

export interface SaveRevisionResponse {
  success: boolean;
  data?: RevisionRecord;
  error?: string;
}

export interface DeleteRevisionResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all revision items for a user.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function fetchRevisions(
  userEmail: string,
  headers: Record<string, string>,
): Promise<FetchRevisionResponse> {
  const res = await fetch(
    `/api/db/revision?userEmail=${encodeURIComponent(userEmail)}`,
    { headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchRevisions failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchRevisionResponse>;
}

/**
 * Upsert a revision item (create or update by id + userEmail).
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function saveRevision(
  payload: SaveRevisionRequest,
  headers: Record<string, string>,
): Promise<SaveRevisionResponse> {
  const res = await fetch('/api/db/revision', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `saveRevision failed: ${res.status}`,
    );
  }
  return res.json() as Promise<SaveRevisionResponse>;
}

/**
 * Delete a revision item by id.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function deleteRevision(
  id: string,
  userEmail: string,
  headers: Record<string, string>,
): Promise<DeleteRevisionResponse> {
  const res = await fetch(
    `/api/db/revision?id=${encodeURIComponent(id)}&userEmail=${encodeURIComponent(userEmail)}`,
    {
      method: 'DELETE',
      headers,
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `deleteRevision failed: ${res.status}`,
    );
  }
  return res.json() as Promise<DeleteRevisionResponse>;
}
