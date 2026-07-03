/**
 * lib/services/projects.ts
 *
 * Typed fetch wrappers for /api/db/projects.
 *
 * TODO: migrate projects/page.tsx inline fetch calls to use these functions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectFeature {
  name: string;
  done?: boolean;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  status: string;
  tech?: string[];
  githubUrl?: string;
  liveUrl?: string;
  features?: ProjectFeature[];
  progress?: number;
  startDate?: string;
  endDate?: string;
  userEmail?: string;
}

export interface FetchProjectsResponse {
  projects: ProjectRecord[];
  error?: string;
}

export interface SaveProjectResponse {
  project: ProjectRecord;
  error?: string;
}

export interface DeleteProjectResponse {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all projects for a user.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function fetchProjects(
  userEmail: string,
  headers: Record<string, string>,
): Promise<FetchProjectsResponse> {
  const res = await fetch(
    `/api/db/projects?userEmail=${encodeURIComponent(userEmail)}`,
    { headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchProjects failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchProjectsResponse>;
}

/**
 * Create a new project.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function createProject(
  payload: Omit<ProjectRecord, 'id'> & { userEmail: string },
  headers: Record<string, string>,
): Promise<SaveProjectResponse> {
  const res = await fetch('/api/db/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `createProject failed: ${res.status}`,
    );
  }
  return res.json() as Promise<SaveProjectResponse>;
}

/**
 * Update an existing project by id.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function updateProject(
  id: string,
  payload: Partial<ProjectRecord>,
  headers: Record<string, string>,
): Promise<SaveProjectResponse> {
  const res = await fetch(`/api/db/projects?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `updateProject failed: ${res.status}`,
    );
  }
  return res.json() as Promise<SaveProjectResponse>;
}

/**
 * Delete a project by id.
 *
 * @throws Error when the network request fails or the server returns a non-2xx status.
 */
export async function deleteProject(
  id: string,
  headers: Record<string, string>,
): Promise<DeleteProjectResponse> {
  const res = await fetch(`/api/db/projects?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `deleteProject failed: ${res.status}`,
    );
  }
  return res.json() as Promise<DeleteProjectResponse>;
}
