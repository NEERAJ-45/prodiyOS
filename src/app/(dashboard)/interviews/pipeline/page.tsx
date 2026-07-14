'use client';

import * as React from 'react';
import { useMounted } from '@/hooks/useMounted';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useApplicationsQuery, useUpdateApplication } from '@/hooks/use-interviews';
import { KanbanBoard } from '@/components/interviews/kanban-board';

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  priority: string;
}

const statuses = [
  'APPLIED', 'PHONE_SCREEN', 'TECH_ROUND_1', 'TECH_ROUND_2',
  'SYSTEM_DESIGN', 'HR_CULTURE', 'OFFER',
] as const;

export default function PipelinePage() {
  const { userEmail } = useProfile();
  const { data: appsData } = useApplicationsQuery();
  const updateApplication = useUpdateApplication();
  const mounted = useMounted();

  const applications = (appsData?.applications ?? []) as Application[];

  async function handleStatusChange(id: string, newStatus: string) {
    updateApplication.mutate({ id, userEmail, status: newStatus });
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Pipeline</h1>
        <p className="text-sm text-zinc-500 mt-1">Drag applications between stages</p>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanBoard
          statuses={statuses}
          applications={applications}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
