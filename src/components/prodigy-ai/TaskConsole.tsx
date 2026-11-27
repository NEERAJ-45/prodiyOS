'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Clock, Loader2, Play, RotateCcw, Square, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api, errorMessage } from './client';
import { statusTone, timeAgo } from './format';
import type { Instance, Meta, Task, TaskDetail, Workspace } from './types';

const PRODIGY_CONTEXT = [
  'You are ProdigyAI, the in-house engineering agent for ProdigyOS (Next.js App Router + MongoDB/Mongoose + Tailwind).',
  'The repository is mounted at /workspace. You may read and edit server files, run scripts, and manage the ProdigyOS MongoDB data using MONGODB_URI from the environment.',
  'Follow the conventions in AGENTS.md, keep changes focused, and verify with typecheck/lint/build when possible.',
  'When you finish, summarize exactly what you changed.',
].join(' ');

type Props = {
  meta: Meta | null;
  workspaces: Workspace[];
  instances: Instance[];
  tasks: Task[];
  detail: TaskDetail | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  workspaceId: string;
  onWorkspaceChange: (id: string) => void;
  refresh: () => Promise<void>;
  setError: (message: string) => void;
};

export function TaskConsole({
  meta,
  workspaces,
  instances,
  tasks,
  detail,
  activeId,
  setActiveId,
  workspaceId,
  onWorkspaceChange,
  refresh,
  setError,
}: Props) {
  const [prompt, setPrompt] = useState('');
  const [prodigyContext, setProdigyContext] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const outputRef = useRef<HTMLPreElement>(null);

  const output = detail?.output ?? '';
  const task = detail?.task ?? tasks.find((entry) => entry.id === activeId) ?? null;

  useEffect(() => {
    const node = outputRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [output]);

  async function ensureRunning(id: string) {
    const healthy = instances.find(
      (instance) => instance.workspace_id === id && !instance.exhausted && (instance.status === 'running' || instance.health === 'healthy'),
    );
    if (healthy) return healthy;
    const existing = instances.find((instance) => instance.workspace_id === id);
    if (existing) {
      await api.controlInstance(existing.id, 'start');
      return existing;
    }
    const name = `prodigy-${Math.random().toString(36).slice(2, 6)}`;
    return api.createInstance(name, id);
  }

  async function runTask(event: React.FormEvent) {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || busy) return;
    if (!workspaceId) {
      setError('Select or register a workspace first');
      return;
    }
    setBusy('run');
    setNotice('');
    setError('');
    try {
      await ensureRunning(workspaceId);
      const full = prodigyContext ? `${PRODIGY_CONTEXT}\n\nUSER REQUEST:\n${content}` : content;
      const created = await api.submitTask(workspaceId, full);
      setActiveId(created.id);
      setPrompt('');
      setNotice('Task queued — output streams in as the agent works.');
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  async function cancel() {
    if (!activeId) return;
    setBusy('cancel');
    setError('');
    try {
      await api.cancelTask(activeId);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  async function resume() {
    if (!activeId) return;
    setBusy('resume');
    setError('');
    try {
      const next = await api.resumeTask(activeId);
      setActiveId(next.id);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  const canCancel = task && (task.status === 'running' || task.status === 'queued');
  const canResume = task && (task.status === 'blocked' || task.status === 'failed' || task.status === 'interrupted');

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Card className="flex min-h-[22rem] flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <Bot className="h-4 w-4 text-ring" />
          <span className="text-sm font-medium">ProdigyAI</span>
          {task && (
            <Badge variant="outline" className={cn('text-[10px] capitalize', statusTone(task.status))}>
              {task.status}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            {task && <span className="text-[11px] text-muted-foreground">attempt {task.attempts}</span>}
            {canResume && (
              <Button size="sm" variant="outline" onClick={() => void resume()} disabled={busy === 'resume'}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Resume
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="outline" onClick={() => void cancel()} disabled={busy === 'cancel'}>
                <Square className="mr-1.5 h-3.5 w-3.5" /> Cancel
              </Button>
            )}
          </div>
        </div>

        <pre
          ref={outputRef}
          className="min-h-[18rem] flex-1 overflow-auto whitespace-pre-wrap break-words bg-black/40 p-4 font-mono text-[11.5px] leading-relaxed text-zinc-300"
        >
          {output ? output : (
            <span className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 text-center font-sans text-sm text-muted-foreground">
              <Terminal className="h-5 w-5" />
              <span>No output yet.</span>
              <span className="max-w-sm text-xs">
                Ask ProdigyAI to inspect, change, or deploy — it edits the workspace files and can touch the ProdigyOS database.
              </span>
            </span>
          )}
        </pre>

        {task?.error && (
          <div className="border-t border-red-900/40 bg-red-950/20 px-4 py-2 text-xs text-red-300">{task.error}</div>
        )}
      </Card>

      <Card className="p-3">
        <form onSubmit={runTask} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={workspaceId}
              onChange={(event) => onWorkspaceChange(event.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              aria-label="Workspace"
            >
              <option value="">Select workspace…</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={prodigyContext}
                onChange={(event) => setProdigyContext(event.target.checked)}
                className="h-3 w-3 accent-current"
              />
              ProdigyOS context
            </label>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {meta?.configured === false ? 'Not configured' : 'Agent ready'}
            </span>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void runTask(event);
                }
              }}
              rows={2}
              placeholder="Tell ProdigyAI what to do…"
              className="max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" disabled={busy === 'run' || !prompt.trim()} className="h-10">
              {busy === 'run' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
              Run
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            The instance must be signed in to OpenCode (<span className="font-mono">opencode auth login</span>) or have a credential
            profile. ProdigyAI can edit server files and, when <span className="font-mono">MONGODB_URI</span> is injected, manage the
            ProdigyOS database.
          </p>
          {notice && <p className="text-[11px] text-emerald-400">{notice}</p>}
        </form>
      </Card>

      <Card className="max-h-64 overflow-auto p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Recent tasks
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <div className="space-y-1">
            {tasks.slice(0, 12).map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveId(entry.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent/40',
                  entry.id === activeId && 'bg-accent/60',
                )}
              >
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', entry.status === 'running' ? 'bg-emerald-500' : 'bg-zinc-600')} />
                <span className="min-w-0 flex-1 truncate">{entry.prompt.replace(/\s+/g, ' ').slice(0, 90)}</span>
                <span className={cn('shrink-0 capitalize', statusTone(entry.status))}>{entry.status}</span>
                <span className="shrink-0 text-muted-foreground">{timeAgo(entry.created_at)}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
