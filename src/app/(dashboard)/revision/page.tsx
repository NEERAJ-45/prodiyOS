'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Navbar } from '@/components/layout/navbar';
import { Plus, Pencil, Trash2, CheckCircle, Circle, RefreshCw, Calendar, BookOpen } from 'lucide-react';
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
  stage: number; // 0: Day 1, 1: Day 7, 2: Day 30, 3: Day 90, 4: Day 180, 5: Day 365
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
}

const stages = ['Day 1', 'Day 7', 'Day 30', 'Day 90', 'Day 180', 'Day 365'] as const;
const stageIntervals = [1, 7, 30, 90, 180, 365];

const defaultSeeds: RevisionItem[] = [
  { id: 'seed-os', concept: 'OS Fundamentals & CPU Scheduling', stage: 0, dueDate: new Date().toISOString().split('T')[0], completed: false },
  { id: 'seed-jvm', concept: 'JVM Memory & Garbage Collection Basics', stage: 0, dueDate: new Date().toISOString().split('T')[0], completed: false },
  { id: 'seed-sql', concept: 'SQL Indexing & Joins', stage: 1, dueDate: new Date().toISOString().split('T')[0], completed: false },
  { id: 'seed-cap', concept: 'CAP & PACELC Distributed Theorems', stage: 2, dueDate: new Date().toISOString().split('T')[0], completed: false },
  { id: 'seed-react', concept: 'React Fiber Render Pipeline', stage: 0, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], completed: false }
];

function getDaysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function RevisionPage() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedTab, setSelectedTab] = React.useState('due-now');

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RevisionItem | null>(null);

  // Form State
  const [formConcept, setFormConcept] = useState('');
  const [formStage, setFormStage] = useState(0);
  const [formDueDate, setFormDueDate] = useState('');

  // Load items on mount
  useEffect(() => {
    setMounted(true);
    async function loadItems() {
      try {
        const res = await fetch('/api/db/revision');
        const resData = await res.json();
        if (resData.dbConnected) {
          setDbConnected(true);
          if (resData.data && resData.data.length > 0) {
            setItems(resData.data);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load from DB:', e);
      }

      // Fallback
      const localRaw = localStorage.getItem('revision-scheduler-items');
      if (localRaw) {
        try {
          setItems(JSON.parse(localRaw));
          return;
        } catch {}
      }

      setItems(defaultSeeds);
      localStorage.setItem('revision-scheduler-items', JSON.stringify(defaultSeeds));
    }
    loadItems();
  }, []);

  const saveItem = useCallback(async (item: RevisionItem) => {
    // 1. Update State & LocalStorage
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      let next = [...prev];
      if (idx >= 0) next[idx] = item;
      else next.push(item);
      localStorage.setItem('revision-scheduler-items', JSON.stringify(next));
      return next;
    });

    // 2. Sync to Mongo DB
    if (dbConnected) {
      try {
        await fetch('/api/db/revision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      } catch (e) {
        console.error('Failed to sync to database:', e);
      }
    }
  }, [dbConnected]);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem('revision-scheduler-items', JSON.stringify(next));
      return next;
    });

    if (dbConnected) {
      try {
        await fetch(`/api/db/revision?id=${id}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.error('Failed to delete from database:', e);
      }
    }
  }, [dbConnected]);

  // Form Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConcept.trim()) return;

    const newItem: RevisionItem = {
      id: `rev-${Date.now()}`,
      concept: formConcept.trim(),
      stage: formStage,
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
      completed: false,
    };

    saveItem(newItem);
    setIsAddOpen(false);

    // Reset Form
    setFormConcept('');
    setFormStage(0);
    setFormDueDate('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !formConcept.trim()) return;

    const updated: RevisionItem = {
      ...activeItem,
      concept: formConcept.trim(),
      stage: formStage,
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
    };

    saveItem(updated);
    setIsEditOpen(false);
    setActiveItem(null);

    // Reset Form
    setFormConcept('');
    setFormStage(0);
    setFormDueDate('');
  };

  const openEditDialog = (item: RevisionItem) => {
    setActiveItem(item);
    setFormConcept(item.concept);
    setFormStage(item.stage);
    setFormDueDate(item.dueDate);
    setIsEditOpen(true);
  };

  // Progression logic
  const handleProgress = useCallback((item: RevisionItem) => {
    const nextStage = Math.min(item.stage + 1, 5);
    const offsetDays = stageIntervals[nextStage];
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + offsetDays);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const updated: RevisionItem = {
      ...item,
      stage: nextStage,
      dueDate: nextDateStr,
      completed: false,
    };

    saveItem(updated);
  }, [saveItem]);

  // Calculations
  const stats = useMemo(() => {
    if (!mounted) return { dueToday: 0, overdue: 0, upcoming: 0, total: 0 };
    let dueToday = 0;
    let overdue = 0;
    let upcoming = 0;

    items.forEach((item) => {
      const days = getDaysDiff(item.dueDate);
      if (days === 0) dueToday++;
      else if (days < 0) overdue++;
      else if (days > 0 && days <= 7) upcoming++;
    });

    return { dueToday, overdue, upcoming, total: items.length };
  }, [items, mounted]);

  const filteredItems = useMemo(() => {
    if (selectedTab === 'due-now') {
      return items.filter((item) => getDaysDiff(item.dueDate) <= 0);
    }
    return items;
  }, [items, selectedTab]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      <Navbar />
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Revision Engine</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Spaced repetition for long-term technical concept retention.
            </p>
          </div>

          {/* Add Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <button 
                onClick={() => {
                  setFormConcept('');
                  setFormStage(0);
                  setFormDueDate(new Date().toISOString().split('T')[0]);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
                Add Topic
              </button>
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-zinc-100 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  Add Spaced Repetition Topic
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Concept Name</label>
                  <input
                    type="text"
                    required
                    value={formConcept}
                    onChange={(e) => setFormConcept(e.target.value)}
                    placeholder="e.g. JVM Memory Pools & gc Tuning"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-650 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Repetition Stage</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-colors"
                  >
                    {stages.map((stage, idx) => (
                      <option key={stage} value={idx}>
                        {stage} (Interval: {stageIntervals[idx]} {stageIntervals[idx] === 1 ? 'day' : 'days'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Next Due Date</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-colors scheme-dark"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <DialogClose asChild>
                    <button type="button" className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-zinc-850 hover:bg-zinc-900 transition-colors text-zinc-400 cursor-pointer">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Due Today', value: stats.dueToday, color: 'text-red-400' },
            { label: 'Overdue', value: stats.overdue, color: 'text-orange-400' },
            { label: 'Upcoming (7d)', value: stats.upcoming, color: 'text-blue-400' },
            { label: 'Total Tracked', value: stats.total, color: 'text-emerald-400' },
          ].map((stat) => (
            <Card key={stat.label} className="border-zinc-800/80 bg-zinc-900/40">
              <CardContent className="p-5">
                <p className="text-xs text-zinc-500 mb-1.5">{stat.label}</p>
                <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger
              value="due-now"
              className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Due Now
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              All Schedules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="due-now" className="mt-4">
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <Card className="border-zinc-800/80 bg-zinc-900/40">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-zinc-500">Nothing due right now. You are fully synced!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredItems.map((item) => (
                  <RevisionCard
                    key={item.id}
                    item={item}
                    onComplete={() => handleProgress(item)}
                    onEdit={() => openEditDialog(item)}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-8">
              {stages.map((stageLabel, stageIdx) => {
                const stageItems = items.filter((item) => item.stage === stageIdx);
                if (stageItems.length === 0) return null;
                return (
                  <div key={stageLabel}>
                    <h3 className="text-sm font-semibold text-zinc-400 mb-3">{stageLabel} (revalidate in {stageIntervals[stageIdx]} days)</h3>
                    <div className="space-y-3">
                      {stageItems.map((item) => (
                        <RevisionCard
                          key={item.id}
                          item={item}
                          showStage
                          onComplete={() => handleProgress(item)}
                          onEdit={() => openEditDialog(item)}
                          onDelete={() => deleteItem(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-zinc-100 flex items-center gap-2">
                <Pencil size={16} className="text-primary" />
                Update Revision Topic
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Concept Name</label>
                <input
                  type="text"
                  required
                  value={formConcept}
                  onChange={(e) => setFormConcept(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Repetition Stage</label>
                <select
                  value={formStage}
                  onChange={(e) => setFormStage(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-colors"
                >
                  {stages.map((stage, idx) => (
                    <option key={stage} value={idx}>
                      {stage} (Interval: {stageIntervals[idx]} {stageIntervals[idx] === 1 ? 'day' : 'days'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Next Due Date</label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-colors scheme-dark"
                />
              </div>
              <DialogFooter className="gap-2 pt-2">
                <DialogClose asChild>
                  <button type="button" className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-zinc-850 hover:bg-zinc-900 transition-colors text-zinc-400 cursor-pointer">
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
  showStage,
  onComplete,
  onEdit,
  onDelete,
}: {
  item: RevisionItem;
  showStage?: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = getDaysDiff(item.dueDate);

  return (
    <Card className="border-zinc-800/80 bg-zinc-900/40 transition-all hover:border-zinc-700">
      <CardContent className="p-4 flex items-center gap-4">
        {/* Complete Checkbox (triggers SRS progress) */}
        <button
          onClick={onComplete}
          className="h-5 w-5 shrink-0 rounded border-2 border-zinc-700 hover:border-emerald-500/50 flex items-center justify-center cursor-pointer transition-colors group"
          title="Review Completed (Advance Stage)"
        >
          <Circle size={12} className="text-transparent group-hover:text-emerald-500/30 transition-colors shrink-0" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {item.concept}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar size={11} />
              {item.dueDate}
            </span>
            {days < 0 ? (
              <span className="text-xs text-red-400 font-semibold">{Math.abs(days)}d overdue</span>
            ) : days === 0 ? (
              <span className="text-xs text-amber-400 font-semibold">Due today</span>
            ) : (
              <span className="text-xs text-zinc-500">{days}d left</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showStage && (
            <Badge
              variant="secondary"
              className="text-[10px] font-medium bg-zinc-800 text-zinc-400 border-zinc-700 hidden sm:inline-flex"
            >
              {stages[item.stage]}
            </Badge>
          )}

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="text-zinc-650 hover:text-zinc-300 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Edit Topic"
          >
            <Pencil size={13} />
          </button>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="text-zinc-650 hover:text-red-400 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Delete Topic"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
