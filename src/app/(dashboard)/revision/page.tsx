'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMounted } from '@/hooks/useMounted';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, CheckCircle, Circle, Calendar, BookOpen, RotateCcw } from 'lucide-react';
import { useSaveRevision, useDeleteRevision, useRevisionsQuery } from '@/hooks/use-revision';
import { useProfile } from '@/components/providers/ProfileProvider';
import { SyncStatus, type SyncState } from '@/components/shared/SyncStatus';
import {
  applyRating,
  isDue,
  getDaysDiff,
  backfillLegacyItems,
  INTERVALS,
  type Rating,
} from '@/lib/revision-scheduler';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface RevisionItem {
  id: string;
  concept: string;
  stage: number;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  lastReviewedAt?: string | null;
}

const RATING_BUTTONS: { rating: Rating; key: string; label: string; className: string }[] = [
  { rating: 'again', key: '1', label: 'Again', className: 'border-red-500/40 text-red-400 hover:bg-red-500/10' },
  { rating: 'hard', key: '2', label: 'Hard', className: 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10' },
  { rating: 'good', key: '3', label: 'Good', className: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' },
  { rating: 'easy', key: '4', label: 'Easy', className: 'border-sky-500/40 text-sky-400 hover:bg-sky-500/10' },
];

function isReviewedLast7Days(item: RevisionItem): boolean {
  if (!item.lastReviewedAt) return false;
  const reviewed = new Date(item.lastReviewedAt).getTime();
  return Date.now() - reviewed < 7 * 24 * 60 * 60 * 1000;
}

export default function RevisionPage() {
  return (
    <React.Suspense fallback={null}>
      <RevisionPageInner />
    </React.Suspense>
  );
}

function RevisionPageInner() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get('tab') ?? 'due';
  const { userEmail } = useProfile();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [ratingUndoId, setRatingUndoId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const ratingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RevisionItem | null>(null);

  // Form State
  const [formConcept, setFormConcept] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const { data: revisionsData } = useRevisionsQuery();
  const saveRevisionMutation = useSaveRevision();
  const deleteRevisionMutation = useDeleteRevision();

  // Load: DB first, localStorage fallback; quiet backfill of legacy completed items.
  useEffect(() => {
    let source: RevisionItem[] | null = null;
    if (revisionsData?.dbConnected && revisionsData.data?.length) {
      source = revisionsData.data as RevisionItem[];
    } else {
      const localRaw = localStorage.getItem('revision-scheduler-items');
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) source = parsed;
        } catch {}
      }
    }
    if (!source) return;

    const { items: backfilled, changed } = backfillLegacyItems(source);
    setItems(backfilled);
    if (changed) {
      localStorage.setItem('revision-scheduler-items', JSON.stringify(backfilled));
      if (revisionsData?.dbConnected) {
        backfilled
          .filter((item) => item.lastReviewedAt)
          .forEach((item) => {
            saveRevisionMutation.mutate({ ...item, userEmail });
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revisionsData]);

  const saveItem = useCallback(
    async (item: RevisionItem) => {
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === item.id);
        const next = [...prev];
        if (idx >= 0) next[idx] = item;
        else next.push(item);
        localStorage.setItem('revision-scheduler-items', JSON.stringify(next));
        return next;
      });

      if (revisionsData?.dbConnected && userEmail) {
        setSyncState('saving');
        saveRevisionMutation.mutate(
          { ...item, userEmail },
          { onSettled: (_data, error) => setSyncState(error ? 'error' : 'saved') },
        );
      }
    },
    [revisionsData?.dbConnected, saveRevisionMutation, userEmail],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== id);
        localStorage.setItem('revision-scheduler-items', JSON.stringify(next));
        return next;
      });

      if (revisionsData?.dbConnected && userEmail) {
        setSyncState('saving');
        deleteRevisionMutation.mutate(id, {
          onSettled: (_data, error) => setSyncState(error ? 'error' : 'saved'),
        });
      }
    },
    [revisionsData?.dbConnected, deleteRevisionMutation, userEmail],
  );

  // Form Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConcept.trim()) return;

    const newItem: RevisionItem = {
      id: `rev-${Date.now()}`,
      concept: formConcept.trim(),
      stage: 0,
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
      completed: false,
      lastReviewedAt: null,
    };

    saveItem(newItem);
    setIsAddOpen(false);
    setFormConcept('');
    setFormDueDate('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !formConcept.trim()) return;

    const updated: RevisionItem = {
      ...activeItem,
      concept: formConcept.trim(),
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
    };

    saveItem(updated);
    setIsEditOpen(false);
    setActiveItem(null);
    setFormConcept('');
    setFormDueDate('');
  };

  const openEditDialog = (item: RevisionItem) => {
    setActiveItem(item);
    setFormConcept(item.concept);
    setFormDueDate(item.dueDate);
    setIsEditOpen(true);
  };

  const clearRatingUndo = useCallback(() => {
    if (ratingTimer.current) {
      clearTimeout(ratingTimer.current);
      ratingTimer.current = null;
    }
    setRatingUndoId(null);
  }, []);

  const settleRating = useCallback(
    (item: RevisionItem, rating: Rating) => {
      clearRatingUndo();
      const next = applyRating(item, rating);
      const updated: RevisionItem = { ...item, ...next, completed: true };
      saveItem(updated);
    },
    [clearRatingUndo, saveItem],
  );

  const handleCheck = useCallback(
    (item: RevisionItem) => {
      if (ratingUndoId === item.id) return; // already settled this tick
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      setTimeout(() => setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      }), 600);

      const next = applyRating(item, 'good');
      const updated: RevisionItem = { ...item, ...next, completed: true };
      saveItem(updated);

      setRatingUndoId(item.id);
      if (ratingTimer.current) clearTimeout(ratingTimer.current);
      ratingTimer.current = setTimeout(clearRatingUndo, 5000);
    },
    [clearRatingUndo, ratingUndoId, saveItem],
  );

  const handleUncomplete = useCallback((item: RevisionItem) => {
    saveItem({ ...item, completed: false, lastReviewedAt: null, dueDate: new Date().toISOString().split('T')[0] });
  }, [saveItem]);

  // Keyboard 1-4 rating while undo window is open
  useEffect(() => {
    if (!ratingUndoId) return;
    const handler = (e: KeyboardEvent) => {
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx === -1) return;
      const item = items.find((x) => x.id === ratingUndoId);
      if (!item) return;
      settleRating(item, RATING_BUTTONS[idx].rating);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ratingUndoId, items, settleRating]);

  useEffect(() => () => {
    if (ratingTimer.current) clearTimeout(ratingTimer.current);
  }, []);

  // Calculations
  const stats = useMemo(() => {
    if (!mounted) return { due: 0, completed: 0, total: 0 };
    const due = items.filter((item) => !item.completed && isDue(item)).length;
    const completed = items.filter(isReviewedLast7Days).length;
    return { due, completed, total: items.length };
  }, [items, mounted]);

  const dueItems = useMemo(
    () => items.filter((item) => !item.completed && isDue(item)),
    [items],
  );
  const completedItems = useMemo(() => items.filter(isReviewedLast7Days), [items]);
  const upcomingItems = useMemo(
    () =>
      items
        .filter((item) => !isDue(item) && !isReviewedLast7Days(item))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [items],
  );

  const upcomingGroups = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const inDays = (item: RevisionItem) => getDaysDiff(item.dueDate, now);
    return [
      { label: 'This week', items: upcomingItems.filter((i) => inDays(i) <= 7) },
      { label: 'Next week', items: upcomingItems.filter((i) => inDays(i) > 7 && inDays(i) <= 14) },
      { label: 'Later', items: upcomingItems.filter((i) => inDays(i) > 14) },
    ].filter((g) => g.items.length > 0);
  }, [upcomingItems]);

  const setTab = (next: string) => {
    router.replace(`/revision?tab=${next}`, { scroll: false });
  };

  const renderCard = (item: RevisionItem) => (
    <RevisionCard
      key={item.id}
      item={item}
      checked={checkedIds.has(item.id)}
      ratingUndo={ratingUndoId === item.id}
      onRate={(rating) => settleRating(item, rating)}
      onComplete={() => handleCheck(item)}
      onEdit={() => openEditDialog(item)}
      onDelete={() => deleteItem(item.id)}
      onUncomplete={() => handleUncomplete(item)}
    />
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 space-y-6 md:space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Revision Engine</h1>
              <SyncStatus state={syncState} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Spaced repetition for long-term technical concept retention.
            </p>
          </div>

          {/* Add Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <button
                onClick={() => {
                  setFormConcept('');
                  setFormDueDate(new Date().toISOString().split('T')[0]);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus size={14} />
                Add Topic
              </button>
            </DialogTrigger>
            <DialogContent className="border-border bg-background text-foreground sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  Add Spaced Repetition Topic
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Concept Name</label>
                  <input
                    type="text"
                    required
                    value={formConcept}
                    onChange={(e) => setFormConcept(e.target.value)}
                    placeholder="e.g. JVM Memory Pools & gc Tuning"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Next Due Date</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors scheme-dark"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <DialogClose asChild>
                    <button type="button" className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-card transition-colors text-muted-foreground cursor-pointer">
                      Cancel
                    </button>
                  </DialogClose>
                  <button type="submit" className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer">
                    Create Topic
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Due', value: stats.due, color: 'text-red-400' },
            { label: 'Reviewed (7d)', value: stats.completed, color: 'text-emerald-400' },
            { label: 'Total Tracked', value: stats.total, color: 'text-muted-foreground' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card/40">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1.5">{stat.label}</p>
                <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List Tabs */}
        <Tabs value={selectedTab} onValueChange={setTab} className="mb-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger
              value="due"
              className="text-xs data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              Due
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-xs data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="text-xs data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              Upcoming
            </TabsTrigger>
          </TabsList>

          <TabsContent value="due" className="mt-4">
            <div className="space-y-3">
              {dueItems.length === 0 ? (
                <Card className="border-border bg-card/40">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No topics due — add a concept or pick one from a roadmap.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                dueItems.map(renderCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedItems.length === 0 ? (
              <Card className="border-border bg-card/40">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No revisions in the last 7 days.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">{completedItems.map(renderCard)}</div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            {upcomingGroups.length === 0 ? (
              <Card className="border-border bg-card/40">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Nothing scheduled ahead yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {upcomingGroups.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {group.label}
                    </h3>
                    <div className="space-y-3">{group.items.map(renderCard)}</div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="border-border bg-background text-foreground sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Pencil size={16} className="text-primary" />
                Update Revision Topic
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Concept Name</label>
                <input
                  type="text"
                  required
                  value={formConcept}
                  onChange={(e) => setFormConcept(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Next Due Date</label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors scheme-dark"
                />
              </div>
              <DialogFooter className="gap-2 pt-2">
                <DialogClose asChild>
                  <button type="button" className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-card transition-colors text-muted-foreground cursor-pointer">
                    Cancel
                  </button>
                </DialogClose>
                <button type="submit" className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer">
                  Save Changes
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function RevisionCard({
  item,
  completed,
  checked,
  ratingUndo,
  onComplete,
  onEdit,
  onDelete,
  onUncomplete,
  onRate,
}: {
  item: RevisionItem;
  completed?: boolean;
  checked?: boolean;
  ratingUndo?: boolean;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onUncomplete?: () => void;
  onRate?: (rating: Rating) => void;
}) {
  const days = getDaysDiff(item.dueDate);

  if (completed || isReviewedLast7Days(item)) {
    return (
      <Card className="border-emerald-900/40 bg-card/40">
        <CardContent className="p-4 flex items-center gap-4">
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground line-through truncate">
              {item.concept}
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              Reviewed{item.lastReviewedAt ? ` · next in ${INTERVALS[Math.min(item.stage, INTERVALS.length - 1)]}d` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUncomplete}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-card transition-colors cursor-pointer"
              title="Move Back to Active"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-red-400 p-1.5 rounded hover:bg-card transition-colors cursor-pointer"
              title="Delete Topic"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/40 transition-all hover:border-muted-foreground/30">
      <CardContent className="p-4 flex items-center gap-4">
        <button
          onClick={onComplete}
          className={cn(
            'h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
            checked
              ? 'border-emerald-500 bg-emerald-500/20'
              : 'border-border hover:border-emerald-500/50 group'
          )}
          title="Mark as Reviewed (Good)"
        >
          {checked ? (
            <CheckCircle size={12} className="text-emerald-400 shrink-0" />
          ) : (
            <Circle size={12} className="text-transparent group-hover:text-emerald-500/30 transition-colors shrink-0" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.concept}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={11} />
              {item.dueDate}
            </span>
            {days < 0 ? (
              <span className="text-xs text-red-400 font-semibold">{Math.abs(days)}d overdue</span>
            ) : days === 0 ? (
              <span className="text-xs text-amber-400 font-semibold">Due today</span>
            ) : (
              <span className="text-xs text-muted-foreground">{days}d left</span>
            )}
            <span className="text-xs text-muted-foreground">· stage {item.stage}</span>
          </div>

          {ratingUndo && (
            <div className="flex items-center gap-1.5 mt-2" role="group" aria-label="Adjust rating">
              {RATING_BUTTONS.map(({ rating, key, label, className }) => (
                <button
                  key={rating}
                  onClick={() => onRate?.(rating)}
                  aria-label={`Rate ${label} (key ${key})`}
                  className={cn(
                    'px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-colors',
                    className
                  )}
                >
                  {label} ({key})
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">5s to change</span>
            </div>
          )}
        </div>

        {!ratingUndo && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-card transition-colors cursor-pointer"
              title="Edit Topic"
            >
              <Pencil size={13} />
            </button>

            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-red-400 p-1.5 rounded hover:bg-card transition-colors cursor-pointer"
              title="Delete Topic"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
