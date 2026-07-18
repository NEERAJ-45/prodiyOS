'use client';

import * as React from 'react';
import { useMounted } from '@/hooks/useMounted';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useApplicationsQuery } from '@/hooks/use-interviews';
import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Plus, Search, ArrowUpDown, Building2, ExternalLink,
} from 'lucide-react';
import { ApplicationFormDialog } from '@/components/interviews/application-form';
import { PdfPreviewDialog } from '@/components/interviews/pdf-preview-dialog';
import { format } from 'date-fns';

const statusLabel: Record<string, { label: string; color: string }> = {
  APPLIED:          { label: 'Applied', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  PHONE_SCREEN:     { label: 'Phone Screen', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
  TECH_ROUND_1:     { label: 'Tech Round 1', color: 'bg-violet-950 text-violet-300 border-violet-800' },
  TECH_ROUND_2:     { label: 'Tech Round 2', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  SYSTEM_DESIGN:    { label: 'System Design', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  HR_CULTURE:       { label: 'HR/Culture', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  OFFER:            { label: 'Offer', color: 'bg-green-950 text-green-300 border-green-800' },
  REJECTED:         { label: 'Rejected', color: 'bg-red-950 text-red-300 border-red-800' },
  GHOSTED:          { label: 'Ghosted', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  DIDNT_SHORTLIST:  { label: "Didn't Shortlist", color: 'bg-orange-950 text-orange-300 border-orange-800' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Low', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  HIGH:   { label: 'High', color: 'bg-red-950 text-red-300 border-red-800' },
};

const sourceConfig: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  COMPANY_WEBSITE: 'Website',
  REFERRAL: 'Referral',
  RECRUITER: 'Recruiter',
  OTHER: 'Other',
};

interface Application {
  _id: string;
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  status: string;
  source: string;
  priority: string;
  notes?: string;
  nextRoundDate?: string | null;
  pdfData?: string;
}

type SortField = 'company' | 'role' | 'appliedDate' | 'status' | 'priority';
type SortDir = 'asc' | 'desc';

export default function ApplicationsPage() {
  const { userEmail } = useProfile();
  const { data: appsData, isLoading } = useApplicationsQuery();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [sortField, setSortField] = React.useState<SortField>('appliedDate');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const mounted = useMounted();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingApp, setEditingApp] = React.useState<Application | null>(null);
  const [previewPdf, setPreviewPdf] = React.useState<Application | null>(null);

  const applications = (appsData?.applications ?? []) as Application[];

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function handleEdit(app: Application) {
    setEditingApp(app);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditingApp(null);
    queryClient.invalidateQueries({ queryKey: ['interviews', 'applications'] });
  }

  const filtered = applications
    .filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.company.toLowerCase().includes(q) && !a.role.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'company') cmp = a.company.localeCompare(b.company);
      else if (sortField === 'role') cmp = a.role.localeCompare(b.role);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'priority') {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        cmp = (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1);
      } else {
        cmp = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-zinc-600" />;
    return (
      <span className="text-zinc-300">
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Applications</h1>
          <p className="text-sm text-zinc-500 mt-1">{applications.length} total</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setEditingApp(null); setFormOpen(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600"
        >
          <option value="ALL">All Statuses</option>
          {Object.entries(statusLabel).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-10">#</th>
                {(['company', 'role', 'appliedDate', 'status', 'priority', 'source'] as const).map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-300 transition-colors"
                    onClick={() => toggleSort(col as SortField)}
                  >
                    <div className="flex items-center gap-1">
                      {col === 'company' ? 'Company' : col === 'role' ? 'Role' : col === 'appliedDate' ? 'Applied' : col === 'status' ? 'Status' : col === 'priority' ? 'Priority' : 'Source'}
                      <SortIcon field={col as SortField} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, idx) => {
                const status = statusLabel[app.status] || { label: app.status, color: 'bg-zinc-800 text-zinc-400' };
                const priority = priorityConfig[app.priority] || { label: app.priority, color: 'bg-zinc-800 text-zinc-400' };
                return (
                  <tr
                    key={app.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors cursor-pointer"
                    onClick={() => handleEdit(app)}
                  >
                    <td className="px-4 py-3 text-zinc-600 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-200 font-medium">{app.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{app.role}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {format(new Date(app.appliedDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-[10px] font-medium', status.color)}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-[10px] font-medium', priority.color)}>
                        {priority.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {sourceConfig[app.source] || app.source}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-zinc-500 hover:text-zinc-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(app);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      {app.pdfData ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPdf(app);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-400 bg-blue-950/40 border border-blue-800/40 rounded hover:bg-blue-950/60 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Preview
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <Building2 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No applications found</p>
          </div>
        )}
      </div>

      <ApplicationFormDialog
        open={formOpen}
        onClose={handleFormClose}
        userEmail={userEmail}
        application={editingApp}
      />

      <PdfPreviewDialog
        open={previewPdf !== null}
        onOpenChange={(v) => { if (!v) setPreviewPdf(null); }}
        pdfData={previewPdf?.pdfData ?? ''}
        fileName={`${previewPdf?.company ?? ''} - ${previewPdf?.role ?? ''}`}
      />
    </div>
  );
}
