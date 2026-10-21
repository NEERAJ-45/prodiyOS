import { cn } from '@/lib/utils';

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

const STATE_COPY: Record<Exclude<SyncState, 'idle'>, { label: string; className: string }> = {
  saving: { label: 'Saving…', className: 'text-muted-foreground' },
  saved: { label: 'Saved', className: 'text-emerald-500' },
  offline: { label: 'Offline', className: 'text-amber-500' },
  error: { label: 'Sync failed', className: 'text-red-500' },
};

export function SyncStatus({ state, className }: { state: SyncState; className?: string }) {
  if (state === 'idle') return null;
  const { label, className: stateClass } = STATE_COPY[state];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium', stateClass, className)}
    >
      {state === 'saving' && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}
