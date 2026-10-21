import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { fetchTasks, saveTasks } from '@/lib/services/tasks';
import type { Task } from '@/app/(dashboard)/tasks/task-tree';

function useTaskHeaders() {
  const { userEmail, customDbUrl } = useProfile();
  return useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
    };
    if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
    return headers;
  }, [userEmail, customDbUrl]);
}

export function useTasksQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useTaskHeaders();

  return useQuery({
    queryKey: ['tasks', userEmail],
    queryFn: () => fetchTasks(userEmail, getHeaders()),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveTasks() {
  const { userEmail } = useProfile();
  const getHeaders = useTaskHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tasks: Task[]) => saveTasks(tasks, userEmail, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userEmail] });
    },
  });
}
