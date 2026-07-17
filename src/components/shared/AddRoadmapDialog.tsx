'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAddCustomRoadmap } from '@/hooks/use-custom-roadmaps';

interface QuestionEntry {
  title: string;
  difficulty: string;
  link?: string;
}

interface ParsedData {
  title: string;
  description?: string;
  questions: QuestionEntry[];
  color?: string;
  hours?: number;
  difficulty?: string;
}

function parseRoadmapJson(raw: string): ParsedData {
  const obj = JSON.parse(raw);

  if (!obj.title || typeof obj.title !== 'string') {
    throw new Error('Missing or invalid "title" field (must be a string)');
  }

  let questions: unknown[] = [];

  if (Array.isArray(obj.questions)) {
    questions = obj.questions;
  } else if (Array.isArray(obj.topics)) {
    questions = obj.topics;
  } else {
    throw new Error('Missing "questions" or "topics" array');
  }

  if (questions.length === 0) {
    throw new Error('Questions/topics array is empty');
  }

  questions.forEach((q: unknown, i: number) => {
    const entry = q as Record<string, unknown>;
    if (!entry.title || typeof entry.title !== 'string') {
      throw new Error(`Question at index ${i} is missing a "title" field`);
    }
  });

  return {
    title: obj.title,
    description: obj.description || '',
    questions: questions.map((q) => {
      const entry = q as Record<string, unknown>;
      return {
        title: String(entry.title),
        difficulty: String(entry.difficulty || 'MEDIUM').toUpperCase(),
        link: entry.link ? String(entry.link) : '',
      };
    }),
    color: obj.color || '#8b5cf6',
    hours: typeof obj.hours === 'number' ? obj.hours : 0,
    difficulty: obj.difficulty || 'Medium',
  };
}

export function AddRoadmapDialog() {
  const [open, setOpen] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const addRoadmap = useAddCustomRoadmap();

  const handleParse = () => {
    setParseError(null);
    setParsed(null);
    try {
      const data = parseRoadmapJson(rawJson.trim());
      setParsed(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      setParseError(msg);
    }
  };

  const handleSubmit = async () => {
    if (!parsed) return;
    setSubmitted(true);
    try {
      await addRoadmap.mutateAsync({
        title: parsed.title,
        description: parsed.description || '',
    questions: parsed.questions.map((q: QuestionEntry) => ({
      title: q.title,
      difficulty: q.difficulty,
      link: q.link || '',
    })),
        color: parsed.color || '#8b5cf6',
        hours: parsed.hours || 0,
        difficulty: parsed.difficulty || 'Medium',
      });
      setRawJson('');
      setParsed(null);
      setParseError(null);
      setSubmitted(false);
      setOpen(false);
    } catch {
      setSubmitted(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setRawJson('');
      setParsed(null);
      setParseError(null);
      setSubmitted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0">
          <Plus size={14} />
          Add Roadmap
        </button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            Add Custom DSA Roadmap
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Paste a JSON object below to create a custom DSA roadmap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">JSON Input</label>
            <textarea
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                setParsed(null);
                setParseError(null);
              }}
              placeholder={JSON.stringify(
                {
                  title: 'My Custom DSA Sheet',
                  description: 'My personal DSA practice roadmap',
                  difficulty: 'Medium',
                  color: '#8b5cf6',
                  hours: 100,
                  questions: [
                    { title: 'Two Sum', difficulty: 'EASY', link: 'https://leetcode.com/problems/two-sum/' },
                    { title: 'Add Two Numbers', difficulty: 'MEDIUM', link: '' },
                  ],
                },
                null,
                2,
              )}
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 font-mono outline-none focus:border-primary/50 transition-colors resize-y"
            />
          </div>

          <button
            type="button"
            onClick={handleParse}
            disabled={!rawJson.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-300 cursor-pointer"
          >
            <Upload size={14} />
            Preview &amp; Validate
          </button>

          {parseError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-xs text-red-300">{parseError}</span>
            </div>
          )}

          {parsed && (
            <div className="space-y-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle size={14} />
                <span className="text-xs font-semibold">Validated — {parsed.questions.length} questions</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500">Title:</span>
                  <span className="text-zinc-200 ml-1.5 font-medium">{parsed.title}</span>
                </div>
                {parsed.description && (
                  <div className="col-span-2">
                    <span className="text-zinc-500">Description:</span>
                    <span className="text-zinc-200 ml-1.5">{parsed.description}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Difficulty:</span>
                  <span className="text-zinc-200 ml-1.5">{parsed.difficulty}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Hours:</span>
                  <span className="text-zinc-200 ml-1.5">{parsed.hours || '—'}</span>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsed.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="text-zinc-600 w-5 shrink-0">#{i + 1}</span>
                    <span className="text-zinc-200 truncate">{q.title}</span>
                    <span className={`shrink-0 text-[10px] font-semibold ${
                      q.difficulty === 'EASY' ? 'text-emerald-400' :
                      q.difficulty === 'HARD' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {addRoadmap.isError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-xs text-red-300">
                {addRoadmap.error instanceof Error ? addRoadmap.error.message : 'Failed to save roadmap'}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <button type="button" className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-zinc-800 hover:bg-zinc-900 transition-colors text-zinc-400 cursor-pointer">
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!parsed || submitted}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            {submitted ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus size={14} />
                Create Roadmap
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
