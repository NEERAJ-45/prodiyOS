'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, ServerOff, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api, errorMessage } from './client';
import { InfraPanel } from './InfraPanel';
import { TaskConsole } from './TaskConsole';
import { useProdigy } from './use-prodigy';

const TerminalView = dynamic(() => import('./TerminalView').then((module) => module.TerminalView), { ssr: false });

export function ProdigyAI() {
  const {
    meta,
    runtime,
    workspaces,
    instances,
    tasks,
    detail,
    activeId,
    setActiveId,
    offline,
    error,
    setError,
    refresh,
  } = useProdigy();
  const [workspaceId, setWorkspaceId] = useState('');
  const [tab, setTab] = useState<'agent' | 'terminal'>('agent');
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (!runtime || offline) return;
    if (bootstrapped.current || !meta?.configured || !meta.defaultWorkspace || workspaces.length > 0) return;
    bootstrapped.current = true;
    void api
      .addWorkspace(meta.defaultWorkspaceName, meta.defaultWorkspace)
      .then(() => refresh())
      .catch((caught) => setError(errorMessage(caught)));
  }, [runtime, offline, meta, workspaces.length, refresh, setError]);

  useEffect(() => {
    if (workspaceId || workspaces.length === 0) return;
    const preferred = meta?.defaultWorkspace
      ? workspaces.find((workspace) => workspace.path.replace(/\/+$/, '') === meta.defaultWorkspace.replace(/\/+$/, ''))
      : null;
    setWorkspaceId((preferred ?? workspaces[0]).id);
  }, [workspaceId, workspaces, meta]);

  const status = offline ? 'offline' : meta && !meta.configured ? 'unconfigured' : runtime ? 'online' : 'loading';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border bg-accent/40">
            <Sparkles className="h-4 w-4 text-ring" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">ProdigyAI</h1>
            <p className="text-sm text-muted-foreground">
              Your in-house agent — edits ProdigyOS server files and manages its database.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              status === 'online'
                ? 'bg-emerald-500'
                : status === 'loading'
                  ? 'bg-amber-500'
                  : 'bg-red-500',
            )}
          />
          <span className="capitalize">{status}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss" className="text-red-400/70 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {offline ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <ServerOff className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">ProdigyAI backend is offline</p>
                <p className="text-muted-foreground">
                  The AgentDock server at <span className="font-mono text-xs">{meta?.url ?? 'http://127.0.0.1:8080'}</span> is not
                  reachable.
                </p>
              </div>
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium text-foreground">Start it:</p>
                <pre className="overflow-x-auto rounded-md border bg-black/40 p-2 font-mono text-[11px] text-zinc-300">
{`cd agentdock/backend
set -a && . ./.env && set +a
npm run dev`}
                </pre>
              </div>
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium text-foreground">Point ProdigyOS at it (prodiyOS/.env.local):</p>
                <pre className="overflow-x-auto rounded-md border bg-black/40 p-2 font-mono text-[11px] text-zinc-300">
{`AGENTDOCK_URL=http://127.0.0.1:8080
AGENTDOCK_TOKEN=<API_TOKEN from agentdock/backend/.env>
AGENTDOCK_DEFAULT_WORKSPACE=${meta?.defaultWorkspace || '/absolute/path/to/prodiyOS'}`}
                </pre>
                <p className="text-xs">Restart the Next.js dev server after changing env.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void refresh()}>
                <Activity className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <InfraPanel
            meta={meta}
            runtime={runtime}
            workspaces={workspaces}
            instances={instances}
            workspaceId={workspaceId}
            onWorkspaceChange={setWorkspaceId}
            refresh={refresh}
            setError={setError}
          />
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex w-fit items-center gap-1 rounded-lg border p-1 text-xs">
              <button
                type="button"
                onClick={() => setTab('agent')}
                className={cn(
                  'rounded-md px-3 py-1.5 transition-colors',
                  tab === 'agent' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => setTab('terminal')}
                className={cn(
                  'rounded-md px-3 py-1.5 transition-colors',
                  tab === 'terminal' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Terminal
              </button>
            </div>

            {tab === 'agent' ? (
              <TaskConsole
                meta={meta}
                workspaces={workspaces}
                instances={instances}
                tasks={tasks}
                detail={detail}
                activeId={activeId}
                setActiveId={setActiveId}
                workspaceId={workspaceId}
                onWorkspaceChange={setWorkspaceId}
                refresh={refresh}
                setError={setError}
              />
            ) : (
              <Card className="flex min-h-[26rem] flex-1 flex-col overflow-hidden p-0">
                <TerminalView instances={instances} workspaceId={workspaceId} />
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
