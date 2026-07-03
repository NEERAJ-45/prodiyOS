/**
 * lib/services/daily.ts
 *
 * Typed fetch wrappers for /api/db/daily and /api/db/activity.
 *
 * TODO: migrate use-daily.ts to delegate to these functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyRecord {
  completedTaskIds: string[];
  note: string;
}

export interface FetchDailyResponse {
  record: DailyRecord | null;
  error?: string;
}

export interface SyncDailyRequest {
  date: string;
  completedTaskIds: string[];
  note: string;
  userEmail: string;
}

export interface SyncDailyResponse {
  success: boolean;
  error?: string;
}

export interface LogActivityResponse {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch the daily record for a given date.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function fetchDaily(date: string): Promise<FetchDailyResponse> {
  const res = await fetch(`/api/db/daily?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchDaily failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchDailyResponse>;
}

/**
 * Upsert the daily record for a given date.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function syncDaily(
  payload: SyncDailyRequest,
): Promise<SyncDailyResponse> {
  const res = await fetch('/api/db/daily', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `syncDaily failed: ${res.status}`,
    );
  }
  return res.json() as Promise<SyncDailyResponse>;
}

/**
 * Append an activity log entry.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function logActivity(
  userEmail: string,
  text: string,
): Promise<LogActivityResponse> {
  const res = await fetch('/api/db/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `logActivity failed: ${res.status}`,
    );
  }
  return res.json() as Promise<LogActivityResponse>;
}
