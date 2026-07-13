import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import type { ProjectRecord } from '@/lib/services/projects';
import { fetchProjects, createProject, updateProject, deleteProject } from '@/lib/services/projects';

function useProjectsHeaders() {
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

export function useProjectsQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useProjectsHeaders();

  return useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(userEmail, getHeaders()),
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProject() {
  const getHeaders = useProjectsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: Omit<ProjectRecord, 'id'> & { userEmail: string }) =>
      createProject(project, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const getHeaders = useProjectsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectRecord> }) =>
      updateProject(id, data, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const getHeaders = useProjectsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id, getHeaders()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
