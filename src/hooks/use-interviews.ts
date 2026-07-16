import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';

function useInterviewsHeaders() {
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

export interface Application {
  _id: string;
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  status: string;
  source?: string;
  priority?: string;
  notes?: string;
  nextRoundDate?: string | null;
  pdfData?: string;
}

interface ApplicationsResponse {
  applications: Application[];
}

export interface Round {
  id: string;
  applicationId: string;
  roundType: string;
  date: string;
  notes: string;
  selfRating: number;
}

interface RoundsResponse {
  rounds: Round[];
}

export interface Company {
  id: string;
  name: string;
  compRange?: string;
  techStack?: string[];
  contacts?: Array<{ name: string; role: string; email: string; linkedin: string }>;
  whyInterested?: string;
  notes?: string;
}

interface CompanyResponse {
  company: Company;
}

interface CompaniesResponse {
  companies: Company[];
}

export function useApplicationsQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useInterviewsHeaders();

  return useQuery<ApplicationsResponse>({
    queryKey: ['interviews', 'applications'],
    queryFn: async () => {
      const res = await fetch(`/api/interviews?userEmail=${encodeURIComponent(userEmail)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 30 * 1000,
  });
}

export function useCreateApplication() {
  const getHeaders = useInterviewsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create application');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'applications'] });
    },
  });
}

export function useUpdateApplication() {
  const getHeaders = useInterviewsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/interviews/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update application');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'applications'] });
    },
  });
}

export function useDeleteApplication() {
  const getHeaders = useInterviewsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/interviews/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete application');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'applications'] });
    },
  });
}

export function useResetApplications() {
  const { userEmail } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/interviews/reset?userEmail=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useRoundsQuery(applicationId: string) {
  const { userEmail } = useProfile();
  const getHeaders = useInterviewsHeaders();

  return useQuery<RoundsResponse>({
    queryKey: ['interviews', 'rounds', applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/rounds?userEmail=${encodeURIComponent(userEmail)}&applicationId=${applicationId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch rounds');
      return res.json();
    },
    enabled: !!userEmail && !!applicationId,
    staleTime: 30 * 1000,
  });
}

export function useCreateRound() {
  const getHeaders = useInterviewsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/rounds', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create round');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'rounds', variables.applicationId as string] });
    },
  });
}

export function useDeleteRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rounds/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete round');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'rounds'] });
    },
  });
}

export function useCompanyQuery(companyId: string) {
  const getHeaders = useInterviewsHeaders();

  return useQuery<CompanyResponse>({
    queryKey: ['interviews', 'companies', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCompany() {
  const getHeaders = useInterviewsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update company');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'companies', variables.id] });
    },
  });
}

export function useCompaniesQuery() {
  const { userEmail } = useProfile();
  const getHeaders = useInterviewsHeaders();

  return useQuery<CompaniesResponse>({
    queryKey: ['interviews', 'companies'],
    queryFn: async () => {
      const res = await fetch(`/api/companies?userEmail=${encodeURIComponent(userEmail)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCompany() {
  const getHeaders = useInterviewsHeaders();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', 'companies'] });
    },
  });
}
