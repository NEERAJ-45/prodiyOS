import type { Instance, Meta, Runtime, Task, TaskDetail, Workspace } from './types';

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...((init?.headers as Record<string, string> | undefined) ?? {}) };
  if (init?.body !== undefined && init.body !== null && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers,
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : typeof data === 'string' && data
          ? data
          : res.statusText;
    throw new Error(message || `Request failed (${res.status})`);
  }
  return data as T;
}

function proxy<T>(path: string, init?: RequestInit): Promise<T> {
  return jsonFetch<T>('/api/prodigy' + path, init);
}

const get = <T,>(path: string) => proxy<T>(path);
const post = <T,>(path: string, body?: unknown) =>
  proxy<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const del = <T,>(path: string) => proxy<T>(path, { method: 'DELETE' });

export const metaApi = {
  get: () => jsonFetch<Meta>('/api/prodigy-config'),
};

export const api = {
  runtime: () => get<Runtime>('/api/runtime'),
  workspaces: () => get<Workspace[]>('/api/workspaces'),
  addWorkspace: (name: string, path: string) => post<Workspace>('/api/workspaces', { name, path }),
  removeWorkspace: (id: string) => del<{ ok: boolean }>(`/api/workspaces/${encodeURIComponent(id)}`),
  instances: () => get<Instance[]>('/api/instances'),
  createInstance: (name: string, workspaceId: string) => post<Instance>('/api/instances', { name, workspaceId }),
  controlInstance: (id: string, action: 'start' | 'stop' | 'restart') =>
    post<Instance>(`/api/instances/${encodeURIComponent(id)}/${action}`),
  removeInstance: (id: string) => del<{ ok: boolean }>(`/api/instances/${encodeURIComponent(id)}`),
  openTerminal: (instanceId: string) =>
    post<{ id: string }>(`/api/instances/${encodeURIComponent(instanceId)}/terminal`),
  readTerminal: (sessionId: string, cursor: number) =>
    get<{ data: string; cursor: number; exited: boolean }>(
      `/api/terminals/${encodeURIComponent(sessionId)}?cursor=${cursor}`,
    ),
  writeTerminal: (sessionId: string, data: string) =>
    post<{ ok: boolean }>(`/api/terminals/${encodeURIComponent(sessionId)}/input`, { data }),
  resizeTerminal: (sessionId: string, cols: number, rows: number) =>
    post<{ ok: boolean }>(`/api/terminals/${encodeURIComponent(sessionId)}/resize`, { cols, rows }),
  closeTerminal: (sessionId: string) =>
    del<{ ok: boolean }>(`/api/terminals/${encodeURIComponent(sessionId)}`),
  tasks: () => get<Task[]>('/api/tasks'),
  task: (id: string) => get<TaskDetail>(`/api/tasks/${encodeURIComponent(id)}`),
  submitTask: (workspaceId: string, prompt: string, instanceId?: string) =>
    post<Task>('/api/tasks', { workspaceId, prompt, instanceId }),
  cancelTask: (id: string) => post<{ ok: boolean }>(`/api/tasks/${encodeURIComponent(id)}/cancel`),
  resumeTask: (id: string) => post<Task>(`/api/tasks/${encodeURIComponent(id)}/resume`),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}
