'use client';

import * as React from 'react';
import { Loader2, Sparkles, X, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useAtsRun, type AtsResult } from '@/hooks/use-resume-analyses';
import { mergeChanges } from '@/lib/diff';

interface Props {
  source: string;
  resumeId?: string | null;
  onApply: (source: string) => void;
  onClose: () => void;
}

function extractApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export default function Humanizer({ source, resumeId, onApply, onClose }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<AtsResult | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [openPattern, setOpenPattern] = React.useState<number | null>(0);

  const atsRun = useAtsRun();

  async function run() {
    setBusy(true);
    setResult(null);
    setEditing(null);
    try {
      const res = await atsRun.mutateAsync({
        resume: source,
        jobDescription: '',
        action: 'humanize',
        resumeId,
      });
      if (res.optimizedSource) {
        const cleaned = res.optimizedSource
          .trim()
          .replace(/^```latex\s*/i, '')
          .replace(/```$/g, '')
          .trim();
        setResult(res);
        setEditing(cleaned);
      } else {
        toast({ variant: 'destructive', title: 'Humanizer returned no rewrite. Try again.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Humanization failed', description: extractApiError(err) });
    } finally {
      setBusy(false);
    }
  }

  const patterns = result?.patternsFound ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 shrink-0">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Humanizer</h3>
          <span className="text-[11px] text-zinc-600 hidden sm:inline">
            Rewrites AI-drafted wording into something a person would actually write
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {!result && !busy && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Applies 26 humanization patterns — cuts corporate filler and buzzwords, varies rhythm,
                swaps vague claims for concrete detail — without touching any facts, sections, or LaTeX
                structure. You review the diff before anything is applied.
              </p>
              <Button size="sm" onClick={run} className="bg-purple-600 hover:bg-purple-500 text-white h-8">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Humanize this resume
              </Button>
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              Rewriting wording while preserving every fact…
            </div>
          )}

          {result && patterns.length > 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Patterns applied · {patterns.length}
              </h4>
              <div className="space-y-1.5">
                {patterns.map((p, i) => {
                  const open = openPattern === i;
                  return (
                    <div key={i} className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 overflow-hidden">
                      <button
                        onClick={() => setOpenPattern(open ? null : i)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-900/60 transition-colors"
                      >
                        <span className="text-[11px] font-mono text-purple-400 shrink-0">{p.pattern}</span>
                        {p.section && (
                          <span className="text-[11px] text-zinc-600 truncate">in {p.section}</span>
                        )}
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-zinc-600 ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {open && (
                        <div className="px-3 pb-2.5 space-y-1.5">
                          <div className="rounded bg-red-950/20 border border-red-900/30 px-2 py-1.5">
                            <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-0.5">Before</p>
                            <p className="text-xs text-zinc-400 font-mono leading-relaxed break-words">{p.before}</p>
                          </div>
                          <div className="rounded bg-emerald-950/20 border border-emerald-900/30 px-2 py-1.5">
                            <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-0.5">After</p>
                            <p className="text-xs text-zinc-300 font-mono leading-relaxed break-words">{p.after}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {editing !== null && (
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Rewritten LaTeX — edit, then apply
                </h4>
                <Button
                  size="sm"
                  onClick={() => {
                    onApply(mergeChanges(source, editing));
                    onClose();
                    toast({ title: 'Humanized wording applied to your resume' });
                  }}
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Apply to editor
                </Button>
              </div>
              <textarea
                value={editing}
                onChange={(e) => setEditing(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full resize-y bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-200 outline-none focus:border-purple-500/50 leading-relaxed"
              />
            </div>
          )}

          {result && !busy && (
            <div className="flex items-start gap-2 text-[11px] text-zinc-600 border-t border-zinc-800 pt-3">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
              <span>
                Facts are untouched by design — only wording changed. Compile afterwards to confirm the PDF still looks right.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
