'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

const formSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  appliedDate: z.string().min(1, 'Date is required'),
  status: z.enum(['APPLIED', 'PHONE_SCREEN', 'TECH_ROUND_1', 'TECH_ROUND_2', 'SYSTEM_DESIGN', 'HR_CULTURE', 'OFFER', 'REJECTED', 'GHOSTED', 'DIDNT_SHORTLIST']),
  source: z.enum(['LINKEDIN', 'COMPANY_WEBSITE', 'REFERRAL', 'RECRUITER', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  notes: z.string().optional(),
  nextRoundDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const statusOptions = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'TECH_ROUND_1', label: 'Tech Round 1' },
  { value: 'TECH_ROUND_2', label: 'Tech Round 2' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'HR_CULTURE', label: 'HR/Culture' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'GHOSTED', label: 'Ghosted' },
  { value: 'DIDNT_SHORTLIST', label: "Didn't Shortlist" },
];

const sourceOptions = [
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'COMPANY_WEBSITE', label: 'Company Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

interface ApplicationFormDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  application?: {
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
  } | null;
}

export function ApplicationFormDialog({ open, onClose, userEmail, application }: ApplicationFormDialogProps) {
  const isEdit = !!application;
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const defaultValues: FormData = application
    ? {
        company: application.company,
        role: application.role,
        appliedDate: application.appliedDate ? application.appliedDate.slice(0, 10) : '',
        status: application.status as FormData['status'],
        source: application.source as FormData['source'],
        priority: application.priority as FormData['priority'],
        notes: application.notes || '',
        nextRoundDate: application.nextRoundDate ? application.nextRoundDate.slice(0, 16) : '',
      }
    : {
        company: '',
        role: '',
        appliedDate: new Date().toISOString().slice(0, 10),
        status: 'APPLIED',
        source: 'LINKEDIN',
        priority: 'MEDIUM',
        notes: '',
        nextRoundDate: '',
      };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
      setPdfFile(null);
      setPdfDataUrl('');
    }
  }, [open, application, defaultValues, reset]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setPdfDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: FormData) {
    try {
      const body: Record<string, unknown> = {
        ...data,
        userEmail,
        pdfData: pdfDataUrl || application?.pdfData || '',
      };

      if (isEdit) {
        await fetch(`/api/interviews/${application!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('Application updated');
      } else {
        await fetch('/api/interviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        toast.success('Application added');
      }
      onClose();
    } catch {
      toast.error('Something went wrong');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{isEdit ? 'Edit Application' : 'Add Application'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Company</label>
              <Input {...register('company')} placeholder="e.g. Google" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
              {errors.company && <p className="text-xs text-red-400">{errors.company.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Role</label>
              <Input {...register('role')} placeholder="e.g. SDE II" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
              {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Applied Date</label>
              <Input type="date" {...register('appliedDate')} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
              {errors.appliedDate && <p className="text-xs text-red-400">{errors.appliedDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Next Round (optional)</label>
              <Input type="datetime-local" {...register('nextRoundDate')} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Status</label>
              <select {...register('status')} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600">
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Source</label>
              <select {...register('source')} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600">
                {sourceOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Priority</label>
              <select {...register('priority')} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600">
                {priorityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Resume / PDF (optional)</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                {pdfFile ? pdfFile.name : 'Choose PDF'}
              </button>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => { setPdfFile(null); setPdfDataUrl(''); }}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {!pdfFile && application?.pdfData && (
                <span className="text-xs text-zinc-500">PDF attached</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Any notes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none focus:border-zinc-600 placeholder:text-zinc-600"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
