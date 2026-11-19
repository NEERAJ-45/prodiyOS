import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSchedulePlan, deleteSchedulePlan, fetchSchedulePlans, updateScheduleEvent, type SchedulePlan } from '@/lib/services/schedule-plans';

export function useSchedulePlansQuery() { return useQuery({ queryKey: ['schedule-plans'], queryFn: fetchSchedulePlans, staleTime: 60_000 }); }
export function useCreateSchedulePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: createSchedulePlan, onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule-plans'] }) }); }
export function useUpdateScheduleEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: updateScheduleEvent, onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule-plans'] }) }); }
export function useDeleteSchedulePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: deleteSchedulePlan, onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule-plans'] }) }); }
export function planEvents(plan: SchedulePlan | undefined) { return plan?.events ?? []; }
