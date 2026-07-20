'use client';

import { useState } from 'react';
import { StickyNote, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface NotesDialogProps {
  id: number;
  initialValue: string;
  onSave: (id: number, val: string) => void;
}

export function NotesDialog({ id, initialValue, onSave }: NotesDialogProps) {
  const [val, setVal] = useState(initialValue);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(id, val);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium transition-all cursor-pointer mx-auto",
            initialValue
              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
              : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/80"
          )}
        >
          <StickyNote size={13} />
          {initialValue ? 'Note' : 'Add Note'}
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-background sm:max-w-[400px] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2.5 text-base font-semibold">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <NotebookPen size={14} className="text-indigo-400" />
            </span>
            Quick Note
          </DialogTitle>
        </DialogHeader>

        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Type your notes here..."
          className="w-full min-h-[160px] bg-muted/40 border border-border rounded-lg p-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed transition-colors focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10"
        />

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <button className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Save Note
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
