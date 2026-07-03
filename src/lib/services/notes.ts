/**
 * lib/services/notes.ts
 *
 * Typed fetch wrappers for /api/db/notes.
 *
 * TODO: migrate use-notes.ts to delegate to these functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NoteRecord {
  storagePrefix: string;
  itemId: string;
  note: string;
}

export interface FetchNotesResponse {
  dbConnected: boolean;
  data: NoteRecord[];
  error?: string;
}

export interface SaveNoteRequest {
  storagePrefix: string;
  itemId: string;
  userEmail: string;
  /** Provide a non-empty string to upsert; omit / empty string to delete. */
  note?: string;
  itemTitle?: string;
}

export interface SaveNoteResponse {
  success: boolean;
  data?: NoteRecord;
  deleted?: boolean;
  error?: string;
}

export interface ResetNotesRequest {
  storagePrefix: string;
  userEmail: string;
}

export interface ResetNotesResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all notes for a user.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function fetchNotes(
  userEmail: string,
  headers: Record<string, string>,
): Promise<FetchNotesResponse> {
  const res = await fetch(
    `/api/db/notes?userEmail=${encodeURIComponent(userEmail)}`,
    { headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchNotes failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchNotesResponse>;
}

/**
 * Upsert or delete a single note.
 * Passes `note` as empty/undefined to delete; non-empty string to upsert.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function saveNote(
  payload: SaveNoteRequest,
  headers: Record<string, string>,
): Promise<SaveNoteResponse> {
  const res = await fetch('/api/db/notes', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `saveNote failed: ${res.status}`,
    );
  }
  return res.json() as Promise<SaveNoteResponse>;
}

/**
 * Delete all notes for a given storagePrefix.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function resetNotes(
  payload: ResetNotesRequest,
  headers: Record<string, string>,
): Promise<ResetNotesResponse> {
  const res = await fetch('/api/db/notes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, resetAll: true }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `resetNotes failed: ${res.status}`,
    );
  }
  return res.json() as Promise<ResetNotesResponse>;
}
