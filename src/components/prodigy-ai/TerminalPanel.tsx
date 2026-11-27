'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { cn } from '@/lib/utils';
import { api, errorMessage } from './client';

type Props = {
  instanceId: string | null;
};

type Status = 'idle' | 'connecting' | 'ready' | 'closed' | 'error';

const tone: Record<Status, string> = {
  idle: 'bg-zinc-500',
  connecting: 'bg-amber-500',
  ready: 'bg-emerald-500',
  closed: 'bg-zinc-500',
  error: 'bg-red-500',
};

export function TerminalPanel({ instanceId }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionRef = useRef<string | null>(null);
  const cursorRef = useRef(0);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Select a running instance');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.25,
      scrollback: 2000,
      theme: {
        background: '#09090b',
        foreground: '#d4d4d8',
        cursor: '#a1a1aa',
        selectionBackground: '#3f3f46',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;
    try {
      fit.fit();
    } catch {
      /* layout not ready */
    }

    const dataSubscription = term.onData((data) => {
      const sessionId = sessionRef.current;
      if (sessionId) void api.writeTerminal(sessionId, data).catch(() => {});
    });

    const handleResize = () => {
      try {
        fit.fit();
      } catch {
        return;
      }
      const sessionId = sessionRef.current;
      if (sessionId && term.cols && term.rows) void api.resizeTerminal(sessionId, term.cols, term.rows).catch(() => {});
    };

    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    observer.observe(host);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      dataSubscription.dispose();
      const sessionId = sessionRef.current;
      if (sessionId) void api.closeTerminal(sessionId).catch(() => {});
      sessionRef.current = null;
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    let cancelled = false;
    let timer = 0;

    const previous = sessionRef.current;
    if (previous) {
      void api.closeTerminal(previous).catch(() => {});
      sessionRef.current = null;
    }
    term.reset();
    cursorRef.current = 0;

    if (!instanceId) {
      setStatus('idle');
      setMessage('Select a running instance');
      return;
    }

    setStatus('connecting');
    setMessage('Opening terminal…');

    void (async () => {
      try {
        const session = await api.openTerminal(instanceId);
        if (cancelled) {
          void api.closeTerminal(session.id).catch(() => {});
          return;
        }
        sessionRef.current = session.id;
        setStatus('ready');
        setMessage('');
        try {
          fitRef.current?.fit();
        } catch {
          /* ignore */
        }
        if (term.cols && term.rows) void api.resizeTerminal(session.id, term.cols, term.rows).catch(() => {});
        term.focus();

        const poll = async () => {
          if (cancelled || !sessionRef.current) return;
          try {
            const chunk = await api.readTerminal(session.id, cursorRef.current);
            cursorRef.current = chunk.cursor;
            if (chunk.data) term.write(chunk.data);
            if (chunk.exited) {
              setStatus('closed');
              setMessage('Session ended');
              return;
            }
          } catch (caught) {
            setStatus('error');
            setMessage(errorMessage(caught));
            return;
          }
          timer = window.setTimeout(() => void poll(), 400);
        };
        void poll();
      } catch (caught) {
        if (cancelled) return;
        setStatus('error');
        setMessage(errorMessage(caught));
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      const sessionId = sessionRef.current;
      if (sessionId) {
        void api.closeTerminal(sessionId).catch(() => {});
        sessionRef.current = null;
      }
    };
  }, [instanceId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
        <TerminalIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Terminal</span>
        <span className={cn('h-1.5 w-1.5 rounded-full', tone[status])} />
        <span className="capitalize">{status}</span>
        {message && <span className="ml-auto truncate">{message}</span>}
      </div>
      <div className="relative min-h-[22rem] flex-1 overflow-hidden bg-[#09090b] p-2">
        <div ref={hostRef} className="h-full w-full" />
        {!instanceId && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Boot an agent instance to open a terminal
          </div>
        )}
      </div>
    </div>
  );
}
