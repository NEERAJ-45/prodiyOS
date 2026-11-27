'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { TerminalPanel } from './TerminalPanel';
import type { Instance } from './types';

type Props = {
  instances: Instance[];
  workspaceId: string;
};

const instanceTone = (instance: Instance) => {
  if (instance.exhausted) return 'bg-orange-500';
  if (instance.status === 'running') return 'bg-emerald-500';
  return 'bg-zinc-500';
};

export function TerminalView({ instances, workspaceId }: Props) {
  const scoped = useMemo(
    () => instances.filter((instance) => !workspaceId || instance.workspace_id === workspaceId),
    [instances, workspaceId],
  );
  const [instanceId, setInstanceId] = useState('');

  useEffect(() => {
    if (instanceId && scoped.some((instance) => instance.id === instanceId)) return;
    const running = scoped.find((instance) => instance.status === 'running') ?? scoped[0];
    setInstanceId(running ? running.id : '');
  }, [scoped, instanceId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <select
          value={instanceId}
          onChange={(event) => setInstanceId(event.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          aria-label="Instance"
        >
          <option value="">Select instance…</option>
          {scoped.map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.name} ({instance.status})
            </option>
          ))}
        </select>
        {scoped.length > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                instanceTone(scoped.find((instance) => instance.id === instanceId) ?? scoped[0]),
              )}
            />
            shared with the agent
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          Run <span className="font-mono">opencode auth login</span> here
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <TerminalPanel instanceId={instanceId || null} />
      </div>
    </div>
  );
}
