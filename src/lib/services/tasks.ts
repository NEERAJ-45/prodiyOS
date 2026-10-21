/**
 * lib/services/tasks.ts
 *
 * Typed fetch wrappers for /api/db/tasks (whole-list upsert per user).
 */

import type { Task } from '@/app/(dashboard)/tasks/task-tree';

export interface FetchTasksResponse {
  dbConnected: boolean;
  data: Task[];
  error?: string;
}

export interface SaveTasksResponse {
  success: boolean;
  data?: Task[];
  error?: string;
}

/**
 * Fetch the whole task list for a user.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function fetchTasks(
  userEmail: string,
  headers: Record<string, string>,
): Promise<FetchTasksResponse> {
  const res = await fetch(
    `/api/db/tasks?userEmail=${encodeURIComponent(userEmail)}`,
    { headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchTasks failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchTasksResponse>;
}

/**
 * Replace the whole task list for a user (upsert by userEmail).
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function saveTasks(
  tasks: Task[],
  userEmail: string,
  headers: Record<string, string>,
): Promise<SaveTasksResponse> {
  const res = await fetch('/api/db/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tasks, userEmail, updatedAt: new Date().toISOString() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `saveTasks failed: ${res.status}`,
    );
  }
  return res.json() as Promise<SaveTasksResponse>;
}
