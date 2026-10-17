'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DOC_STATUSES, DOC_STATUS_LABELS, type DocStatus } from '@/hooks/use-docs';
import { useUploadThing } from '@/lib/uploadthing';

type DocFileType = 'pdf' | 'docx' | 'md';

function detectDocFileType(fileName: string): DocFileType | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return null;
}

export interface DocFormState {
  title: string;
  category: string;
  status: DocStatus;
  fileUrl?: string;
  fileType?: DocFileType;
  fileName?: string;
}

interface DocFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  form: DocFormState;
  onFormChange: (form: DocFormState) => void;
  onSave: () => void;
  isPending: boolean;
  categorySuggestions: string[];
}

export function DocFormDialog({
  open,
  onOpenChange,
  mode,
  form,
  onFormChange,
  onSave,
  isPending,
  categorySuggestions,
}: DocFormDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const { startUpload } = useUploadThing('docUploader', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        set('fileUrl', res[0].url);
        set('fileName', res[0].name);
        setUploading(false);
      }
    },
    onUploadError: () => {
      setFileError('Upload failed. Try again or use a smaller file.');
      setUploading(false);
    },
  });

  const set = (field: keyof DocFormState, value: string | undefined) => {
    onFormChange({ ...form, [field]: value });
  };

  React.useEffect(() => {
    if (!open) setFileError(null);
  }, [open]);

  const isValid =
    form.title.trim().length > 0 && (mode === 'edit' || (!!form.fileUrl && !!form.fileType));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {mode === 'add' ? 'Add Doc' : 'Edit Doc'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Title *">
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Document title"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="e.g. notes, specs, manuals"
              list="doc-category-suggestions"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
            <datalist id="doc-category-suggestions">
              {categorySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          {mode === 'add' && (
            <Field label="File * (PDF, DOCX, MD)">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFileError(null);
                  set('fileUrl', undefined);
                  set('fileType', undefined);
                  set('fileName', undefined);
                  if (!file) return;

                  const type = detectDocFileType(file.name);
                  if (!type) {
                    setFileError('Unsupported file type. Use PDF, DOCX, or MD.');
                    return;
                  }
                  set('fileType', type);
                  setUploading(true);
                  startUpload([file]);
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-100"
              >
                {uploading ? 'Uploading...' : form.fileName ? 'Change File' : 'Choose File'}
              </Button>
              {form.fileName && (
                <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                  {form.fileName}
                </span>
              )}
            </div>
            {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
          </Field>
          )}
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v as DocStatus)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                {DOC_STATUSES.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    {DOC_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={onSave} disabled={!isValid || isPending || uploading}>
            {uploading
              ? 'Uploading...'
              : isPending
                ? mode === 'add' ? 'Adding...' : 'Saving...'
                : mode === 'add' ? 'Add Doc' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
