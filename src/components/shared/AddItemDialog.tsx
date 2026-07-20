'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddItemDialogProps {
  onAdd: (title: string, difficulty: string, link: string) => void;
  itemLabel?: string;
  titlePlaceholder?: string;
  linkPlaceholder?: string;
}

export function AddItemDialog({
  onAdd,
  itemLabel = 'Topic',
  titlePlaceholder = 'e.g. B+ Tree Node Structure',
  linkPlaceholder = 'e.g. https://www.geeksforgeeks.org/...',
}: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), difficulty, link.trim());
    setTitle('');
    setDifficulty('MEDIUM');
    setLink('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0 ml-2">
          <Plus size={14} />
          Add {itemLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Add Custom {itemLabel}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">{itemLabel} Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Reference Link (Optional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={linkPlaceholder}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <button type="button" className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted/50 transition-colors text-muted-foreground cursor-pointer">
                Cancel
              </button>
            </DialogClose>
            <button type="submit" className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer">
              Add {itemLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
