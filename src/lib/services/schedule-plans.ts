import type { ScheduleEvent, SchedulePlan } from '@/lib/schedule-plans/types';

export interface SchedulePlansResponse { plans: SchedulePlan[]; error?: string }
async function jsonOrError(res: Response) { const body = await res.json().catch(() => ({})); if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`); return body; }
export async function fetchSchedulePlans(): Promise<SchedulePlansResponse> { return jsonOrError(await fetch('/api/schedule-plans')) as Promise<SchedulePlansResponse>; }
export async function createSchedulePlan(payload: Omit<SchedulePlan, 'createdAt' | 'updatedAt'>): Promise<{ plan: SchedulePlan }> { return jsonOrError(await fetch('/api/schedule-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })); }
export async function updateScheduleEvent(payload: { scheduleId: string; eventId: string; completed?: boolean; notes?: string; status?: string }): Promise<{ plan: SchedulePlan }> { return jsonOrError(await fetch('/api/schedule-plans', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })); }
export async function deleteSchedulePlan(scheduleId: string): Promise<{ success: boolean }> { return jsonOrError(await fetch(`/api/schedule-plans?scheduleId=${encodeURIComponent(scheduleId)}`, { method: 'DELETE' })); }
export type { ScheduleEvent, SchedulePlan };
