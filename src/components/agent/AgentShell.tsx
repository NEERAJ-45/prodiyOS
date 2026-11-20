'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowUp, Mic, PlugZap, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scanActions, runAction } from '@/lib/agent/actions';
import type { AgentMessage, AgentResponse } from '@/lib/agent/types';
import { createRecognizer, speak, stopSpeaking } from '@/lib/agent/speech';
import { AgentOrb, type OrbState } from './AgentOrb';

const QUICK_PROMPTS = ["What's today?", "What's next?", 'Open my calendar'];

type LogEntry = AgentMessage & { at: string };

function now() {
  return format(new Date(), 'HH:mm');
}

export function AgentShell() {
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<OrbState>('idle');
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [sound, setSound] = useState(true);
  const [listening, setListening] = useState(false);
  const [recognizerSupported, setRecognizerSupported] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer>>(null);

  useEffect(() => {
    setSound(window.localStorage.getItem('samundar-agent-sound') !== 'off');
    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setRecognizerSupported(Boolean(win.SpeechRecognition ?? win.webkitSpeechRecognition));
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    window.localStorage.setItem('samundar-agent-sound', sound ? 'on' : 'off');
  }, [sound]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [entries, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: LogEntry[] = [...entries, { role: 'user', content, at: now() }];
    const visible = scanActions();
    setEntries(next);
    setInput('');
    setError('');
    setBusy(true);
    setPhase('thinking');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content: value }) => ({ role, content: value })),
          actions: visible,
          today: format(new Date(), 'yyyy-MM-dd'),
        }),
      });
      const data = (await res.json()) as AgentResponse & { error?: string };
      if (res.status === 503 && data.error === 'agent_offline') {
        setOffline(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? 'Agent failed');
      setPhase('responding');

      const lines = [data.message];
      if (data.run) {
        const result = runAction(data.run, { allowDangerous: data.runDangerous });
        const label = visible.find((action) => action.id === data.run)?.label ?? data.run;
        lines.push(result.ok ? `Ran ${label}` : `Blocked: ${result.error}`);
      }
      if (data.navigate) {
        router.push(data.navigate);
        lines.push(`Opened ${data.navigate}`);
      }
      if (sound) speak(data.message);
      setEntries([...next, { role: 'assistant', content: lines.join('\n'), at: now() }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Agent failed');
    } finally {
      setBusy(false);
      setPhase('idle');
    }
  }

  const status = offline ? 'Offline' : busy ? 'Working' : 'Ready';

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-medium">Agent</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${offline ? 'bg-destructive' : 'bg-muted-foreground'}`} />
          {status}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-8 ${entries.length === 0 && !offline ? 'h-full justify-center' : ''}`}>
          <div className="flex justify-center">
            <AgentOrb state={phase} />
          </div>

          {offline ? (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
              <PlugZap className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Agent is offline</p>
                <p className="text-sm text-muted-foreground">
                  Add GOOGLE_API_KEY to .env.local and restart the dev server.
                </p>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="space-y-5 text-center">
              <p className="text-base text-muted-foreground">Ask about your plan, or tell it to drive the dashboard.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void send(prompt)}
                    className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{entry.role === 'user' ? 'You' : 'Agent'}</span>
                    <span className="tabular-nums">{entry.at}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
                </div>
              ))}
              {busy && <p className="text-sm text-muted-foreground">Working…</p>}
              <div ref={endRef} />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <div className="border-t">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="mx-auto flex w-full max-w-xl items-end gap-2 px-5 py-3"
        >
          <div className="flex min-h-10 flex-1 items-end gap-2 rounded-lg border bg-muted/20 px-3 py-2 transition-colors focus-within:border-ring">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder={offline ? 'Agent is offline' : 'Ask or command'}
              disabled={offline || busy}
              aria-label="Message the agent"
              className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={offline || busy || !recognizerSupported}
              onClick={() => {
                if (listening) {
                  recognizerRef.current?.stop();
                  setListening(false);
                  return;
                }
                stopSpeaking();
                const recognizer = createRecognizer(
                  (text) => { setListening(false); void send(text); },
                  () => setListening(false),
                );
                if (!recognizer) return;
                recognizerRef.current = recognizer;
                recognizer.start();
                setListening(true);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                listening ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label={listening ? 'Stop listening' : 'Speak to agent'}
              title={recognizerSupported ? 'Speak to agent' : 'Voice input needs Chrome or Edge'}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => { setSound((value) => !value); stopSpeaking(); }}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                sound ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label={sound ? 'Mute replies' : 'Unmute replies'}
            >
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <Button type="submit" size="icon" className="rounded-lg" disabled={offline || busy || !input.trim()} aria-label="Send">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
