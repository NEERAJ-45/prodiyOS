'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowUp, Bot, Mic, PlugZap, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scanActions, runAction } from '@/lib/agent/actions';
import type { AgentMessage, AgentResponse } from '@/lib/agent/types';
import { createRecognizer, speak, stopSpeaking } from '@/lib/agent/speech';
import { AgentOrb, type OrbState } from './AgentOrb';

const QUICK_PROMPTS = ["What's today?", "What's next?", 'Open my calendar'];

type LogEntry = AgentMessage & { at: string };

function now() {
  return format(new Date(), 'HH:mm:ss');
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
        lines.push(result.ok ? `> ran: ${label}` : `> blocked: ${result.error}`);
      }
      if (data.navigate) {
        router.push(data.navigate);
        lines.push(`> opened: ${data.navigate}`);
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

  return (
    <div className="hud-surface hud-scanlines relative flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="text-cyan-400/90">Samundar</span>
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${offline ? 'bg-destructive' : 'animate-pulse bg-cyan-400'}`} />
          {offline ? 'offline' : busy ? phase : 'online'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
          <div className="flex justify-center">
            <AgentOrb state={phase} />
          </div>

          {offline ? (
            <div className="flex items-start gap-3 border border-white/10 bg-black/20 p-4">
              <PlugZap className="mt-0.5 h-4 w-4 text-cyan-400/80" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">Agent offline</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Add GOOGLE_API_KEY to .env.local and restart the dev server.</p>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="space-y-5 text-center">
              <div>
                <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.35em] text-foreground">Samundar Agent</h1>
                <p className="mt-2 text-xs text-muted-foreground">Ask about your plan, or tell it to drive the dashboard.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void send(prompt)}
                    className="border border-white/10 px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    [{prompt}]
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, index) => (
                <div key={index} className="border-b border-white/5 py-3 last:border-0">
                  <div className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                    <span className={entry.role === 'user' ? 'text-muted-foreground' : 'text-cyan-400/90'}>
                      {entry.role === 'user' ? 'user' : 'agent'}
                    </span>
                    <span className="text-muted-foreground/50">{entry.at}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{entry.content}</p>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-400/80">
                  <span className="flex gap-1">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />
                    <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400 [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400 [animation-delay:300ms]" />
                  </span>
                  {phase === 'thinking' ? 'processing' : 'executing'}
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {error && <p className="font-mono text-xs text-destructive">! {error}</p>}
        </div>
      </div>

      <div className="border-t border-white/5 bg-black/20">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="mx-auto flex w-full max-w-2xl items-end gap-2 px-4 py-3"
        >
          <div className="flex min-h-10 flex-1 items-end gap-2 border border-white/10 bg-black/30 px-3 py-2 transition-colors focus-within:border-cyan-400/40">
            <span className="pb-0.5 font-mono text-xs text-cyan-400/80">{'>'}</span>
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
              placeholder={offline ? 'agent offline' : 'ask or command…'}
              disabled={offline || busy}
              className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
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
              className={`flex h-9 w-9 items-center justify-center border transition-colors disabled:opacity-40 ${
                listening ? 'border-cyan-400/60 text-cyan-300' : 'border-white/10 text-muted-foreground hover:text-foreground'
              }`}
              aria-label={listening ? 'Stop listening' : 'Speak to agent'}
              title={recognizerSupported ? 'Speak to agent' : 'Voice input needs Chrome or Edge'}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => { setSound((value) => !value); stopSpeaking(); }}
              className={`flex h-9 w-9 items-center justify-center border transition-colors ${
                sound ? 'border-cyan-400/40 text-cyan-300' : 'border-white/10 text-muted-foreground hover:text-foreground'
              }`}
              aria-label={sound ? 'Mute replies' : 'Unmute replies'}
            >
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <Button type="submit" size="icon" disabled={offline || busy || !input.trim()} aria-label="Send">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50">
          <span className="flex items-center gap-1.5"><Bot className="h-3 w-3" /> gemini-3.5-flash</span>
          <span>enter to send · shift+enter newline</span>
        </div>
      </div>
    </div>
  );
}
