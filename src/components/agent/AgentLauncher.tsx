'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AgentShell } from './AgentShell';

export function AgentLauncher({ showLabel = false }: { showLabel?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-2 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
          showLabel ? 'w-full px-3 py-2 text-sm font-medium' : 'p-1.5'
        }`}
        title="Open agent"
        aria-label="Open agent"
        data-agent-action="open-agent"
        data-agent-label="Open the agent panel"
      >
        <Bot className="h-3.5 w-3.5" />
        {showLabel && <span>Agent</span>}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetTitle className="sr-only">Samundar Agent</SheetTitle>
          <AgentShell />
        </SheetContent>
      </Sheet>
    </>
  );
}
