'use client';

import { useEffect, useState } from 'react';
import { Boxes, Cpu, HardDrive, Loader2, Play, Plus, RefreshCw, Server, Square, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api, errorMessage } from './client';
import { formatBytes } from './format';
import type { Instance, Meta, Runtime, Workspace } from './types';

type Props = {
  meta: Meta | null;
  runtime: Runtime | null;
  workspaces: Workspace[];
  instances: Instance[];
  workspaceId: string;
  onWorkspaceChange: (id: string) => void;
  refresh: () => Promise<void>;
  setError: (message: string) => void;
};

const instanceTone = (instance: Instance) => {
  if (instance.exhausted) return 'bg-orange-500';
  if (instance.health === 'unhealthy') return 'bg-red-500';
  if (instance.status === 'running') return 'bg-emerald-500';
  return 'bg-zinc-500';
};

export function InfraPanel({
  meta,
  runtime,
  workspaces,
  instances,
  workspaceId,
  onWorkspaceChange,
  refresh,
  setError,
}: Props) {
  const [wsName, setWsName] = useState('');
  const [wsPath, setWsPath] = useState('');
  const [instName, setInstName] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!wsPath && meta?.defaultWorkspace) setWsPath(meta.defaultWorkspace);
  }, [meta, wsPath]);

  useEffect(() => {
    if (!wsName && meta?.defaultWorkspaceName) setWsName(meta.defaultWorkspaceName);
  }, [meta, wsName]);

  const workspaceName = (id: string) => workspaces.find((workspace) => workspace.id === id)?.name ?? 'unknown';

  async function addWorkspace(event: React.FormEvent) {
    event.preventDefault();
    if (!wsName.trim() || !wsPath.trim() || busy) return;
    setBusy('workspace');
    setError('');
    try {
      const workspace = await api.addWorkspace(wsName.trim(), wsPath.trim());
      setWsName('');
      onWorkspaceChange(workspace.id);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  async function removeWorkspace(id: string) {
    setBusy(`rm-ws-${id}`);
    setError('');
    try {
      await api.removeWorkspace(id);
      if (workspaceId === id) onWorkspaceChange('');
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  async function bootAgent(event: React.FormEvent) {
    event.preventDefault();
    if (!workspaceId) {
      setError('Add or select a workspace first');
      return;
    }
    const base = (instName.trim() || `prodigy-ai-${Math.random().toString(36).slice(2, 6)}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 30);
    setBusy('boot');
    setError('');
    try {
      try {
        await api.createInstance(base, workspaceId);
      } catch {
        await api.createInstance(`${base}-${Math.random().toString(36).slice(2, 5)}`.slice(0, 31), workspaceId);
      }
      setInstName('');
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  async function control(id: string, action: 'start' | 'stop' | 'restart') {
    setBusy(`${action}-${id}`);
    setError('');
    try {
      await api.controlInstance(id, action);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  async function removeInstance(id: string) {
    setBusy(`rm-${id}`);
    setError('');
    try {
      await api.removeInstance(id);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Boxes className="h-3.5 w-3.5" /> Server
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Server className="h-3 w-3" /> Docker
            </div>
            <p className="font-medium">{runtime ? runtime.dockerVersion : '—'}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cpu className="h-3 w-3" /> CPUs
            </div>
            <p className="font-medium">{runtime ? runtime.cpus : '—'}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HardDrive className="h-3 w-3" /> Memory
            </div>
            <p className="font-medium">{runtime ? formatBytes(runtime.memTotal) : '—'}</p>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Agents running</div>
            <p className="font-medium">
              {runtime ? `${runtime.running} / ${runtime.instances}` : '—'}
              {runtime && runtime.tasksRunning > 0 && (
                <span className="ml-2 text-xs text-amber-400">{runtime.tasksRunning} task(s)</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Server className="h-3.5 w-3.5" /> Workspaces
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {workspaces.length === 0 && (
            <p className="text-sm text-muted-foreground">No workspace yet. Register the ProdigyOS repo below.</p>
          )}
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={cn(
                'group flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors',
                workspace.id === workspaceId ? 'border-ring bg-accent/40' : 'hover:bg-accent/30',
              )}
            >
              <button
                type="button"
                onClick={() => onWorkspaceChange(workspace.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate font-medium">{workspace.name}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{workspace.path}</span>
              </button>
              <button
                type="button"
                onClick={() => void removeWorkspace(workspace.id)}
                disabled={busy === `rm-ws-${workspace.id}`}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label={`Remove ${workspace.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addWorkspace} className="mt-3 space-y-2 border-t pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Input value={wsName} onChange={(event) => setWsName(event.target.value)} placeholder="Name" className="h-8" />
            <Input value={wsPath} onChange={(event) => setWsPath(event.target.value)} placeholder="/absolute/path" className="h-8 font-mono text-xs" />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={busy === 'workspace'} className="w-full">
            {busy === 'workspace' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Register workspace
          </Button>
        </form>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Boxes className="h-3.5 w-3.5" /> Agent instances
        </div>

        <div className="space-y-1.5">
          {instances.length === 0 && (
            <p className="text-sm text-muted-foreground">No containers yet. Boot one to run ProdigyAI.</p>
          )}
          {instances.map((instance) => (
            <div key={instance.id} className="rounded-md border px-2.5 py-2">
              <div className="flex items-center gap-2">
                <span className={cn('h-1.5 w-1.5 rounded-full', instanceTone(instance))} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{instance.name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {instance.exhausted ? 'cooling' : instance.status}
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-muted-foreground">{workspaceName(instance.workspace_id)}</span>
                <div className="flex shrink-0 items-center gap-0.5">
                  {instance.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => void control(instance.id, 'stop')}
                      disabled={busy === `stop-${instance.id}`}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Stop"
                    >
                      <Square className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void control(instance.id, 'start')}
                      disabled={busy === `start-${instance.id}`}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Start"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void control(instance.id, 'restart')}
                    disabled={busy === `restart-${instance.id}`}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Restart"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeInstance(instance.id)}
                    disabled={busy === `rm-${instance.id}`}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={bootAgent} className="mt-3 space-y-2 border-t pt-3">
          <Input
            value={instName}
            onChange={(event) => setInstName(event.target.value)}
            placeholder="Instance name (optional)"
            className="h-8"
          />
          <Button type="submit" size="sm" className="w-full" disabled={busy === 'boot' || !workspaceId}>
            {busy === 'boot' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            Boot agent for selected workspace
          </Button>
        </form>
      </Card>
    </div>
  );
}
