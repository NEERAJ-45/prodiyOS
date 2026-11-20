'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowUp, Mic, PlugZap, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scanActions, runAction } from '@/lib/agent/actions';
import type { AgentMessage, AgentResponse } from '@/lib/agent/types';
import { AgentOrb, type OrbState } from './AgentOrb';
import { createRecognizer, speak, stopSpeaking } from '@/lib/agent/speech';

const QUICK_PROMPTS = ["What's today?", "What's next?", 'Open my calendar'];

export function AgentShell() {
  const router = useRouter();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
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
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: AgentMessage[] = [...messages, { role: 'user', content }];
    const visible = scanActions();
    setMessages(next);
    setInput('');
    setError('');
    setBusy(true);
    setPhase('thinking');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, actions: visible, today: format(new Date(), 'yyyy-MM-dd') }),
      });
      const data = (await res.json()) as AgentResponse & { error?: string };
      if (res.status === 503 && data.error === 'agent_offline') {
        setOffline(true);
        setMessages(messages);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? 'Agent failed');
      setPhase('responding');

      const lines = [data.message];
      if (data.run) {
        const result = runAction(data.run, { allowDangerous: data.runDangerous });
        const label = visible.find((action) => action.id === data.run)?.label ?? data.run;
        lines.push(result.ok ? `Ran: ${label}` : `Could not run ${label}: ${result.error}`);
      }
      if (data.navigate) {
        router.push(data.navigate);
        lines.push(`Opened ${data.navigate}`);
      }
      setMessages([...next, { role: 'assistant', content: lines.join('\n') }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Agent failed');
      setMessages(next);
    } finally {
      setBusy(false);
      setPhase('idle');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
          <AgentOrb state={phase} />

          {offline ? (
            <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <PlugZap className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Agent offline</p>
                <p className="mt-1 text-sm text-muted-foreground">Add GOOGLE_API_KEY to .env.local and restart the dev server.</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4 text-center">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Samundar Agent</h1>
                <p className="mt-1 text-sm text-muted-foreground">Ask about your plan, or tell it to drive the dashboard.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void send(prompt)}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      message.role === 'user'
                        ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl bg-secondary px-4 py-2.5 text-sm text-foreground'
                        : 'max-w-[85%] whitespace-pre-wrap rounded-2xl border px-4 py-2.5 text-sm text-foreground/90'
                    }
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {busy && <p className="text-xs text-muted-foreground">{phase === 'thinking' ? 'Thinking…' : 'Working…'}</p>}
              <div ref={endRef} />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <div className="border-t bg-background">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3 md:px-6"
        >
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
            placeholder={offline ? 'Agent offline' : 'Ask or command…'}
            disabled={offline || busy}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={offline || busy || !recognizerSupported}
            onClick={() => {
              if (listening) { recognizerRef.current?.stop(); setListening(false); return; }
              stopSpeaking();
              const recognizer = createRecognizer((text) => { setListening(false); void send(text); }, () => setListening(false));
              if (!recognizer) return;
              recognizerRef.current = recognizer;
              recognizer.start();
              setListening(true);
            }}
            aria-label={listening ? 'Stop listening' : 'Speak to agent'}
            title={recognizerSupported ? 'Speak to agent' : 'Voice input needs Chrome or Edge'}
          >
            <Mic className={`h-4 w-4 ${listening ? 'text-ring' : ''}`} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => { setSound((value) => !value); stopSpeaking(); }}
            aria-label={sound ? 'Mute replies' : 'Unmute replies'}
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button type="submit" size="icon" disabled={offline || busy || !input.trim()} aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
