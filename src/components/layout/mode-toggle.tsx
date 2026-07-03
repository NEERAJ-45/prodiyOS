'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { useModeStore } from '@/lib/stores/mode-store';
import { cn } from '@/lib/utils';
import { RefreshCw, Check, AlertCircle, Cloud, Database } from 'lucide-react';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

const STORAGE_KEY = 'daily-completions';
const NOTES_KEY = 'daily-notes';
const SLOT_COMPLETIONS_KEY = 'daily-slot-completions';
const SLOT_NOTES_KEY = 'daily-slot-notes';

async function pushDailyData() {
  const todayKey = new Date().toISOString().slice(0, 10);

  const completionsRaw = localStorage.getItem(STORAGE_KEY);
  const notesRaw = localStorage.getItem(NOTES_KEY);
  const slotCompletionsRaw = localStorage.getItem(SLOT_COMPLETIONS_KEY);
  const slotNotesRaw = localStorage.getItem(SLOT_NOTES_KEY);

  const completions: Record<string, string[]> = completionsRaw ? JSON.parse(completionsRaw) : {};
  const notes: Record<string, string> = notesRaw ? JSON.parse(notesRaw) : {};

  const dates = new Set([...Object.keys(completions), ...Object.keys(notes)]);
  if (slotCompletionsRaw) {
    Object.keys(JSON.parse(slotCompletionsRaw)).forEach((d) => dates.add(d));
  }

  const results: { date: string; ok: boolean }[] = [];
  for (const date of dates) {
    try {
      const body: Record<string, unknown> = { date };
      if (completions[date]) body.completedTaskIds = completions[date];
      if (notes[date]) body.note = notes[date];

      const res = await fetch('/api/db/daily', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      results.push({ date, ok: res.ok });
    } catch {
      results.push({ date, ok: false });
    }
  }
  return results;
}

async function testConnection() {
  const res = await fetch('/api/sync', { method: 'POST' });
  if (!res.ok) throw new Error('DB unreachable');
  return res.json();
}

export function ModeToggle() {
  const { mode, toggleMode, setMode } = useModeStore();
  const [syncing, setSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  async function handleSync() {
    setSyncing(true);
    setSyncStatus('idle');
    try {
      await pushDailyData();
      await testConnection();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setMode('HOME')}
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors',
          mode === 'HOME'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-zinc-500 hover:text-zinc-300',
        )}
        title="Home — Atlas cluster"
      >
        <Cloud className="h-3 w-3" />
        <span className="hidden 2xl:inline">HOME</span>
      </button>
      <Switch
        checked={mode === 'OFFICE'}
        onCheckedChange={toggleMode}
        className="scale-75"
      />
      <button
        onClick={() => setMode('OFFICE')}
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors',
          mode === 'OFFICE'
            ? 'text-amber-400 bg-amber-500/10'
            : 'text-zinc-500 hover:text-zinc-300',
        )}
        title="Office — local MongoDB"
      >
        <Database className="h-3 w-3" />
        <span className="hidden 2xl:inline">OFFICE</span>
      </button>
      <button
        onClick={handleSync}
        disabled={syncing}
        className={cn(
          'ml-0.5 inline-flex items-center justify-center rounded-md p-1 transition-colors',
          syncStatus === 'success' ? 'text-emerald-400 hover:text-emerald-300' :
          syncStatus === 'error' ? 'text-red-400 hover:text-red-300' :
          'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800',
        )}
        title="Sync local data to server"
      >
        {syncing ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : syncStatus === 'success' ? (
          <Check className="h-3 w-3" />
        ) : syncStatus === 'error' ? (
          <AlertCircle className="h-3 w-3" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
