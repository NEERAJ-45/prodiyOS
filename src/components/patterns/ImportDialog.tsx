'use client';

import { useCallback, useRef, useState } from 'react';
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
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Table2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { useAddCustomRoadmap } from '@/hooks/use-custom-roadmaps';
import { toast } from '@/components/ui/toast';
import {
  parseBulkQuestions,
  detectImportMode,
  type ImportMode,
  type BulkQuestion,
} from '@/lib/bulk-import';
import { cn } from '@/lib/utils';

const MODES: { id: ImportMode; label: string; icon: typeof FileText }[] = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { id: 'csv', label: 'CSV', icon: Table2 },
];

const ACCEPT = '.csv,.tsv,.xlsx,.xlsm,.xls,.txt,.text,.md';
const EXCEL_RE = /\.(xlsx|xlsm|xls)$/i;

function difficultyClass(d: string): string {
  if (d === 'EASY') return 'text-emerald-400';
  if (d === 'HARD') return 'text-red-400';
  return 'text-amber-400';
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>('csv');
  const [content, setContent] = useState<string | ArrayBuffer>('');
  const [filename, setFilename] = useState('');
  const [rows, setRows] = useState<BulkQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const addRoadmap = useAddCustomRoadmap();
  const isSpreadsheet = content instanceof ArrayBuffer;

  const runParse = useCallback((value: string | ArrayBuffer, nextMode: ImportMode) => {
    try {
      setRows(parseBulkQuestions(value, nextMode));
      setError(null);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Failed to parse content.');
    }
  }, []);

  const loadContent = useCallback(
    (name: string, value: string | ArrayBuffer) => {
      const detected = detectImportMode(name, typeof value === 'string' ? value : '');
      setFilename(name);
      setContent(value);
      setMode(detected);
      setTitle((prev) => prev || titleFromFilename(name));
      runParse(value, detected);
    },
    [runParse]
  );

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => loadContent(file.name, reader.result ?? '');
      reader.onerror = () => setError('Could not read the file.');
      if (EXCEL_RE.test(file.name)) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    },
    [loadContent]
  );

  const handleModeChange = (next: ImportMode) => {
    setMode(next);
    if (next === 'excel') {
      if (content instanceof ArrayBuffer) runParse(content, next);
      else setError('Excel mode expects an .xlsx file upload.');
      return;
    }
    if (typeof content === 'string' && content.trim()) runParse(content, next);
    else if (content instanceof ArrayBuffer) {
      setRows([]);
      setError('This file was loaded as Excel. Re-upload it as CSV or Text.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text.trim()) return;
    e.preventDefault();
    loadContent(filename || 'pasted.txt', text);
  };

  const reset = () => {
    setMode('csv');
    setContent('');
    setFilename('');
    setRows([]);
    setError(null);
    setTitle('');
    setDragging(false);
    setSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    if (!rows.length || !title.trim()) return;
    setSubmitting(true);
    try {
      await addRoadmap.mutateAsync({
        title: title.trim(),
        description: `Imported from ${filename || 'bulk upload'} (${rows.length} questions)`,
        questions: rows.map((q) => ({
          title: q.title,
          difficulty: q.difficulty,
          link: q.link || '',
        })),
        color: '#8b5cf6',
        hours: 0,
        difficulty: 'Medium',
      });
      toast({
        variant: 'success',
        title: `Imported ${rows.length} question${rows.length === 1 ? '' : 's'}`,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import roadmap.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground bg-muted/30 hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer">
          <UploadCloud size={13} />
          Import
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <UploadCloud size={18} className="text-primary" />
            Bulk Import Roadmap
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Upload a file or paste rows below. Each row becomes one question.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onPaste={handlePaste}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors cursor-pointer outline-none',
              dragging
                ? 'border-primary bg-primary/10'
                : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 focus-visible:border-primary/50'
            )}
          >
            <UploadCloud
              size={30}
              className={cn('transition-colors', dragging ? 'text-primary' : 'text-muted-foreground')}
            />
            <p className="text-xs font-medium text-foreground">
              Drop your file here, or <span className="text-primary">browse</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Supports .xlsx, .csv, .txt — you can also paste content
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Format</span>
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                const disabled = m.id === 'excel' && !isSpreadsheet;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={disabled}
                    title={disabled ? 'Upload an .xlsx file to use Excel mode' : undefined}
                    onClick={() => handleModeChange(m.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                      disabled
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'cursor-pointer',
                      active
                        ? 'bg-background text-foreground shadow-sm'
                        : !disabled && 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon size={12} />
                    {m.label}
                  </button>
                );
              })}
            </div>
            {filename && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={filename}>
                {filename}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Roadmap title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My DSA Prep Sheet"
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle size={14} />
                  <span className="text-xs font-semibold">
                    Parsed — {rows.length} question{rows.length === 1 ? '' : 's'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRows([]);
                    setContent('');
                    setFilename('');
                    setError(null);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1">
                {rows.map((q, i) => (
                  <div
                    key={`${q.title}-${i}`}
                    className="group flex items-center gap-2 text-xs rounded-md px-1.5 py-1 hover:bg-muted/60"
                  >
                    <span className="text-zinc-600 w-5 shrink-0 tabular-nums">{i + 1}</span>
                    <span className="text-zinc-200 truncate flex-1" title={q.title}>
                      {q.title}
                    </span>
                    <span className={cn('shrink-0 text-[10px] font-semibold', difficultyClass(q.difficulty))}>
                      {q.difficulty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 p-0.5 rounded text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <button
              type="button"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/50 transition-colors text-muted-foreground cursor-pointer"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!rows.length || !title.trim() || submitting}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Plus size={14} />
                Import {rows.length || ''} Question{rows.length === 1 ? '' : 's'}
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
