'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/useMounted';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useApplicationsQuery, useUpdateApplication, useRoundsQuery, useCreateRound, useDeleteRound } from '@/hooks/use-interviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Building2, ArrowLeft, Save, Star, Clock, Plus, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  notes: string;
}

interface Round {
  id: string;
  applicationId: string;
  roundType: string;
  date: string;
  notes: string;
  selfRating: number;
}

export default function CompanyNotesPage() {
  const params = useParams();
  const router = useRouter();
  const { userEmail } = useProfile();
  const companyId = params.companyId as string;

  const { data: appsData } = useApplicationsQuery();
  const { data: roundsData } = useRoundsQuery(companyId);
  const updateApplication = useUpdateApplication();
  const createRound = useCreateRound();
  const deleteRound = useDeleteRound();

  const [prepNotes, setPrepNotes] = React.useState('');
  const mounted = useMounted();

  const [newRound, setNewRound] = React.useState({
    roundType: 'PHONE_SCREEN',
    date: new Date().toISOString().slice(0, 16),
    notes: '',
    selfRating: 3,
  });

  const application = React.useMemo(() => {
    if (!appsData?.applications) return null;
    const apps: Application[] = appsData.applications as Application[];
    return apps.find((a) => a.id === companyId) || null;
  }, [appsData, companyId]);

  const rounds = (roundsData?.rounds ?? []) as Round[];

  React.useEffect(() => {
    if (application) {
      setPrepNotes(application.notes || '');
    }
  }, [application]);

  async function savePrepNotes() {
    if (!application) return;
    try {
      await updateApplication.mutateAsync({ id: application.id, userEmail, notes: prepNotes });
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save');
    }
  }

  async function addRound() {
    if (!application) return;
    try {
      const data = await createRound.mutateAsync({
        userEmail,
        applicationId: application.id,
        ...newRound,
      });
      if (data.round) {
        setNewRound({ roundType: 'PHONE_SCREEN', date: new Date().toISOString().slice(0, 16), notes: '', selfRating: 3 });
        toast.success('Round recorded');
      }
    } catch {
      toast.error('Failed to add round');
    }
  }

  async function handleDeleteRound(id: string) {
    try {
      await deleteRound.mutateAsync(id);
      toast.success('Round deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  if (!mounted || !application) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  const status = statusLabel[application.status] || { label: application.status, color: 'bg-zinc-800 text-zinc-400' };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/interviews')} className="text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-zinc-400" />
            <h1 className="text-xl font-semibold text-zinc-100">{application.company}</h1>
            <Badge variant="outline" className={cn('text-[10px] font-medium', status.color)}>
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">{application.role}</p>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-100">Prep Notes</CardTitle>
          <Button variant="ghost" size="sm" onClick={savePrepNotes} disabled={updateApplication.isPending} className="text-zinc-500 hover:text-zinc-300 gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {updateApplication.isPending ? 'Saving...' : 'Save'}
          </Button>
        </CardHeader>
        <CardContent>
          <textarea
            value={prepNotes}
            onChange={(e) => setPrepNotes(e.target.value)}
            rows={6}
            placeholder="Things to prepare: company research, role requirements, questions to ask, key talking points..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 outline-none resize-y focus:border-zinc-600 placeholder:text-zinc-600 min-h-[120px]"
          />
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-100">Interview Rounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Type</label>
              <select
                value={newRound.roundType}
                onChange={(e) => setNewRound((r) => ({ ...r, roundType: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 outline-none"
              >
                {Object.entries(statusLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Date</label>
              <Input
                type="datetime-local"
                value={newRound.date}
                onChange={(e) => setNewRound((r) => ({ ...r, date: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Rating</label>
              <div className="flex gap-0.5 pt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNewRound((r) => ({ ...r, selfRating: n }))}
                    className={cn('h-6 w-6 rounded text-xs font-medium border transition-colors',
                      newRound.selfRating >= n
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'border-zinc-700 text-zinc-600',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={addRound} className="gap-1 w-full h-8 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
          </div>
          <textarea
            value={newRound.notes}
            onChange={(e) => setNewRound((r) => ({ ...r, notes: e.target.value }))}
            rows={2}
            placeholder="Notes for this round..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none focus:border-zinc-600 placeholder:text-zinc-600"
          />

          {rounds.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-4">No rounds recorded yet</p>
          ) : (
            <div className="space-y-2">
              {rounds.map((round) => {
                const rStatus = statusLabel[round.roundType] || { label: round.roundType, color: 'bg-zinc-800 text-zinc-400' };
                return (
                  <div key={round.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/20 border border-zinc-800/50">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn('h-2.5 w-2.5', n <= round.selfRating ? 'text-amber-500 fill-amber-500' : 'text-zinc-700')}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[10px] font-medium', rStatus.color)}>
                          {rStatus.label}
                        </Badge>
                        <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(round.date), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {round.notes && (
                        <p className="text-sm text-zinc-400 mt-1.5 whitespace-pre-wrap">{round.notes}</p>
                      )}
                    </div>
                    <button onClick={() => handleDeleteRound(round.id)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
