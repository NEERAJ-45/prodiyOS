'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AgentShell } from './AgentShell';

export function AgentLauncher() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Open agent"
        aria-label="Open agent"
        data-agent-action="open-agent"
        data-agent-label="Open the agent panel"
      >
        <Bot className="h-3.5 w-3.5" />
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
