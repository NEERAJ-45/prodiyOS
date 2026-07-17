export interface CustomRoadmapQuestion {
  id: number;
  title: string;
  difficulty: string;
  link: string;
}

export interface CustomRoadmapRecord {
  slug: string;
  title: string;
  description: string;
  storageKey: string;
  questions: CustomRoadmapQuestion[];
  color: string;
  hours: number;
  difficulty: string;
}

export interface FetchCustomRoadmapsResponse {
  dbConnected: boolean;
  data: CustomRoadmapRecord[];
  error?: string;
}

export interface AddCustomRoadmapRequest {
  title: string;
  description: string;
  questions: Omit<CustomRoadmapQuestion, 'id'>[];
  color: string;
  hours: number;
  difficulty: string;
  userEmail: string;
}

export interface AddCustomRoadmapResponse {
  success: boolean;
  data?: CustomRoadmapRecord;
  error?: string;
}

export interface DeleteCustomRoadmapResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

export async function fetchCustomRoadmaps(
  userEmail: string,
  headers: Record<string, string>,
): Promise<FetchCustomRoadmapsResponse> {
  const res = await fetch(
    `/api/db/custom-roadmaps?userEmail=${encodeURIComponent(userEmail)}`,
    { headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `fetchCustomRoadmaps failed: ${res.status}`,
    );
  }
  return res.json() as Promise<FetchCustomRoadmapsResponse>;
}

export async function addCustomRoadmap(
  payload: AddCustomRoadmapRequest,
  headers: Record<string, string>,
): Promise<AddCustomRoadmapResponse> {
  const res = await fetch('/api/db/custom-roadmaps', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `addCustomRoadmap failed: ${res.status}`,
    );
  }
  return res.json() as Promise<AddCustomRoadmapResponse>;
}

export async function deleteCustomRoadmap(
  slug: string,
  userEmail: string,
  headers: Record<string, string>,
): Promise<DeleteCustomRoadmapResponse> {
  const res = await fetch(
    `/api/db/custom-roadmaps?slug=${encodeURIComponent(slug)}&userEmail=${encodeURIComponent(userEmail)}`,
    { method: 'DELETE', headers },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `deleteCustomRoadmap failed: ${res.status}`,
    );
  }
  return res.json() as Promise<DeleteCustomRoadmapResponse>;
}
