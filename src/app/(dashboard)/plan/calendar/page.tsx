'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, format, subMonths } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, FileUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { datesForMonth, dateKey, parseDateKey } from '@/lib/schedule-plans/date-mapping';
import { applyLegacyStartDate, draftsToEvents, parseScheduleCsv } from '@/lib/schedule-plans/csv';
import type { ImportedScheduleDraft, ScheduleEvent } from '@/lib/schedule-plans/types';
import { useCreateSchedulePlan, useDeleteSchedulePlan, useSchedulePlansQuery, useUpdateScheduleEvent } from '@/hooks/use-schedule-plans';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Task mutations (inline so this stays a single file)                 */
/*                                                                     */
/* IMPORTANT: set PLANS_KEY to the same query key your                 */
/* useSchedulePlansQuery uses, and make sure these API routes exist:   */
/*   POST   /api/schedule-plans/:scheduleId/events                     */
/*   PATCH  /api/schedule-plans/:scheduleId/events/:eventId            */
/*   DELETE /api/schedule-plans/:scheduleId/events/:eventId            */
/* ------------------------------------------------------------------ */

const PLANS_KEY = ['schedule-plans'];

type EventFields = {
  title: string;
  date: string;
  category: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
};

async function api(url: string, init: RequestInit, fallback: string) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? fallback);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, event }: { scheduleId: string; event: EventFields & { id: string; completed: boolean } }) =>
      api(`/api/schedule-plans/${scheduleId}/events`, { method: 'POST', body: JSON.stringify(event) }, 'Could not add task'),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLANS_KEY }),
  });
}

function useEditTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, eventId, fields }: { scheduleId: string; eventId: string; fields: EventFields }) =>
      api(`/api/schedule-plans/${scheduleId}/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(fields) }, 'Could not update task'),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLANS_KEY }),
  });
}

function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, eventId }: { scheduleId: string; eventId: string }) =>
      api(`/api/schedule-plans/${scheduleId}/events/${eventId}`, { method: 'DELETE' }, 'Could not delete task'),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLANS_KEY }),
  });
}

/* ------------------------------------------------------------------ */

type EventForm = { title: string; date: string; startTime: string; endTime: string; category: string; notes: string };
const emptyForm = (date: string): EventForm => ({ title: '', date, startTime: '', endTime: '', category: '', notes: '' });

const cellClass = 'min-h-28 rounded-lg border bg-card p-2 text-left transition-colors hover:border-muted-foreground/30';

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.008 } } };
const cellVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.025, duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } }),
};

function EventChip({ event }: { event: ScheduleEvent }) {
  return (
    <span
      className={cn(
        'mb-1 block truncate rounded border px-1.5 py-1 text-[11px] leading-tight',
        event.completed
          ? 'border-border/60 bg-secondary/40 text-muted-foreground line-through'
          : 'border-border bg-secondary/70 text-foreground/90',
      )}
      title={event.title}
    >
      {event.startTime && <span className="font-medium tabular-nums">{event.startTime} </span>}
      {event.title}
    </span>
  );
}

function EventRow({
  event,
  onToggle,
  onEdit,
  onDelete,
  onNotes,
  full = false,
}: {
  event: ScheduleEvent;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNotes?: (notes: string) => void;
  full?: boolean;
}) {
  return (
    <div className="flex gap-3 py-3">
      <input
        type="checkbox"
        checked={event.completed}
        onChange={onToggle}
        aria-label={`Mark ${event.title} complete`}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', event.completed && 'text-muted-foreground line-through')}>{event.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {event.category}
          {event.startTime ? ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ''}` : ''}
        </p>
        {full && onNotes && (
          <textarea
            defaultValue={event.notes ?? ''}
            onBlur={(e) => { if (e.target.value !== (event.notes ?? '')) onNotes(e.target.value); }}
            placeholder="Add a note…"
            className="mt-2 min-h-16 w-full resize-y rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
        )}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <button
          aria-label={`Edit ${event.title}`}
          onClick={onEdit}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label={`Delete ${event.title}`}
          onClick={onDelete}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function DaySummary({ count }: { count: number }) {
  return <p className="text-xs text-muted-foreground">{count ? `${count} scheduled` : 'Nothing scheduled'}</p>;
}

export default function CalendarPlansPage() {
  const { data, isLoading, error } = useSchedulePlansQuery();
  const createPlan = useCreateSchedulePlan();
  const updateEvent = useUpdateScheduleEvent();
  const deletePlan = useDeleteSchedulePlan();
  const createTask = useCreateTask();
  const editTask = useEditTask();
  const deleteTask = useDeleteTask();
  const plans = data?.plans ?? [];
  const [activeId, setActiveId] = useState<string>();
  const activePlan = plans.find((plan) => plan.scheduleId === activeId) ?? plans[0];
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [dayOpen, setDayOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [pending, setPending] = useState<{ fileName: string; format: 'legacy' | 'events'; drafts: ImportedScheduleDraft[] } | null>(null);
  const [importName, setImportName] = useState('');
  const [importStart, setImportStart] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  // task add / edit / delete
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState<EventForm>(() => emptyForm(dateKey(new Date())));
  const [formError, setFormError] = useState('');
  const [eventToDelete, setEventToDelete] = useState<ScheduleEvent | null>(null);
  const formBusy = createTask.isPending || editTask.isPending;

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('date');
    if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return;
    setSelectedDate(param);
    setMonth(parseDateKey(param));
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of activePlan?.events ?? []) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    for (const events of map.values()) events.sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));
    return map;
  }, [activePlan]);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const todayKey = dateKey(new Date());

  function resetImport() {
    setPending(null); setImportName(''); setImportStart(''); setImportError('');
  }

  async function chooseFile(file: File) {
    setImportBusy(true); setImportError('');
    try {
      const parsed = parseScheduleCsv(await file.text());
      if (parsed.errors.length) throw new Error(parsed.errors.join('. '));
      setPending({ fileName: file.name, format: parsed.format, drafts: parsed.drafts });
      setImportName(file.name.replace(/\.csv$/i, ''));
      setImportStart(format(new Date(), 'yyyy-MM-dd'));
    } catch (caught) { setImportError(caught instanceof Error ? caught.message : 'Could not read this file'); }
    finally { setImportBusy(false); }
  }

  async function confirmImport() {
    if (!pending) return;
    const name = importName.trim();
    if (!name) { setImportError('Name is required'); return; }
    let drafts = pending.drafts;
    let startDate = importStart;
    if (pending.format === 'legacy') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) { setImportError('Start date is required'); return; }
      drafts = applyLegacyStartDate(drafts, startDate);
    } else {
      startDate = drafts.map((draft) => draft.date!).sort()[0];
    }
    setImportBusy(true); setImportError('');
    try {
      const events = draftsToEvents(drafts);
      const endDate = events.map((event) => event.date).sort().at(-1) ?? startDate;
      await createPlan.mutateAsync({ scheduleId: crypto.randomUUID(), name, sourceFileName: pending.fileName, startDate, endDate, events });
      setImportOpen(false); resetImport();
    } catch (caught) { setImportError(caught instanceof Error ? caught.message : 'Import failed'); }
    finally { setImportBusy(false); }
  }

  function toggleEvent(event: ScheduleEvent) { if (!activePlan) return; updateEvent.mutate({ scheduleId: activePlan.scheduleId, eventId: event.id, completed: !event.completed }); }
  function saveNotes(event: ScheduleEvent, notes: string) { if (!activePlan) return; updateEvent.mutate({ scheduleId: activePlan.scheduleId, eventId: event.id, notes }); }
  function openDay(key: string) { setSelectedDate(key); setDayOpen(true); }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm(selectedDate));
    setFormError('');
    setDayOpen(false); setFullOpen(false); setFormOpen(true);
  }

  function openEdit(event: ScheduleEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      date: event.date,
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      category: event.category ?? '',
      notes: event.notes ?? '',
    });
    setFormError('');
    setDayOpen(false); setFullOpen(false); setFormOpen(true);
  }

  async function saveTask() {
    if (!activePlan) return;
    const title = form.title.trim();
    if (!title) { setFormError('Title is required'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { setFormError('Date is required'); return; }
    if (form.endTime && !form.startTime) { setFormError('Add a start time or clear the end time'); return; }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) { setFormError('End time must be after start time'); return; }
    setFormError('');

    const fields: EventFields = {
      title,
      date: form.date,
      category: form.category.trim() || 'General',
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (editing) {
        await editTask.mutateAsync({ scheduleId: activePlan.scheduleId, eventId: editing.id, fields });
      } else {
        await createTask.mutateAsync({
          scheduleId: activePlan.scheduleId,
          event: { id: crypto.randomUUID(), completed: false, ...fields },
        });
      }
      setSelectedDate(form.date);
      setMonth(parseDateKey(form.date));
      setFormOpen(false);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not save');
    }
  }

  async function confirmDeleteTask() {
    if (!activePlan || !eventToDelete) return;
    try {
      await deleteTask.mutateAsync({ scheduleId: activePlan.scheduleId, eventId: eventToDelete.id });
    } finally {
      setEventToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <div className="h-8 w-44 rounded-md bg-secondary" />
        <div className="rounded-xl border bg-card p-3 md:p-5">
          <div className="mb-4 h-6 w-36 rounded-md bg-secondary" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <div key={i} className="min-h-28 rounded-lg border bg-secondary/30" />)}
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-6 text-sm text-destructive">Could not load schedules: {error.message}</div>;

  return <div className="space-y-5 p-4 md:p-6">
    {plans.length > 0 && (
      <div className="flex gap-2 overflow-x-auto border-b pb-2">
        {plans.map((plan, index) => (
          <button
            key={plan.scheduleId}
            title={plan.name}
            onClick={() => { setActiveId(plan.scheduleId); setSelectedDate(plan.startDate); setMonth(parseDateKey(plan.startDate)); }}
            className={cn(
              'shrink-0 rounded-md px-3 py-2 text-sm tabular-nums transition-colors',
              plan.scheduleId === activePlan?.scheduleId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            Tab {index + 1}
          </button>
        ))}
      </div>
    )}

    {!activePlan ? <EmptyState onImport={() => setImportOpen(true)} /> : <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{activePlan.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">{activePlan.events.length} events · {activePlan.sourceFileName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openAdd} data-agent-action="event-add" data-agent-label="Add task"><Plus className="h-4 w-4" /> Add task</Button>
          <Button variant="outline" size="sm" onClick={() => { setImportError(''); setImportOpen(true); }} data-agent-action="calendar-import" data-agent-label="Import schedule"><FileUp className="h-4 w-4" /> Import schedule</Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} data-agent-action="calendar-delete-plan" data-agent-label="Delete this schedule" data-agent-danger>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button aria-label="Previous month" onClick={() => setMonth((value) => subMonths(value, 1))} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="text-sm font-medium">{format(month, 'MMMM yyyy')}</h2>
          <button aria-label="Next month" onClick={() => setMonth((value) => addMonths(value, 1))} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="mb-2 grid grid-cols-7 text-center text-xs text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <motion.div
          key={format(month, 'yyyy-MM')}
          variants={gridVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          className="grid grid-cols-7 gap-1"
        >
          {datesForMonth(month).map((date) => {
            const key = dateKey(date);
            const dayEvents = eventsByDate.get(key) ?? [];
            const done = dayEvents.filter((event) => event.completed).length;
            const inMonth = date.getMonth() === month.getMonth();
            return (
              <motion.button
                key={key}
                variants={cellVariants}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                onClick={() => openDay(key)}
                data-agent-action={`day-${key}`}
                data-agent-label={`Open ${key}`}
                aria-label={`${format(date, 'EEEE, MMM d')}${dayEvents.length ? `, ${dayEvents.length} scheduled` : ', nothing scheduled'}`}
                className={cn(cellClass, !inMonth && 'opacity-45', key === selectedDate && 'ring-2 ring-ring')}
              >
                <div className="mb-1 flex items-baseline justify-between">
                  <span className={cn('text-xs tabular-nums', key === todayKey ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground')}>{format(date, 'd')}</span>
                  {dayEvents.length > 0 && <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{done}/{dayEvents.length}</span>}
                </div>
                {dayEvents.slice(0, 3).map((event) => <EventChip key={event.id} event={event} />)}
                {dayEvents.length > 3 && <span className="text-[11px] text-muted-foreground tabular-nums">+{dayEvents.length - 3} more</span>}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </>}

    {/* Day dialog */}
    <Dialog open={dayOpen} onOpenChange={setDayOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{format(parseDateKey(selectedDate), 'EEEE, MMM d')}</DialogTitle>
          <DialogDescription><DaySummary count={selectedEvents.length} /></DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] divide-y overflow-y-auto pr-1">
          {selectedEvents.length
            ? selectedEvents.map((event, i) => (
                <motion.div key={event.id} custom={i} variants={rowVariants} initial={reduceMotion ? false : 'hidden'} animate="show">
                  <EventRow
                    event={event}
                    onToggle={() => toggleEvent(event)}
                    onEdit={() => openEdit(event)}
                    onDelete={() => setEventToDelete(event)}
                  />
                </motion.div>
              ))
            : <p className="py-8 text-center text-sm text-muted-foreground">Nothing scheduled</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" disabled={!activePlan} onClick={openAdd} data-agent-action="event-add-day" data-agent-label="Add task to this day">
            <Plus className="h-4 w-4" /> Add task
          </Button>
          <Button size="sm" disabled={!selectedEvents.length} onClick={() => { setDayOpen(false); setFullOpen(true); }}>Open full day</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Full-day sheet */}
    <Sheet open={fullOpen} onOpenChange={setFullOpen}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{format(parseDateKey(selectedDate), 'EEEE, MMM d')}</SheetTitle>
          <p className="text-xs text-zinc-500">{selectedEvents.length ? `${selectedEvents.length} scheduled` : 'Nothing scheduled'}</p>
        </SheetHeader>
        <div className="flex-1 divide-y overflow-y-auto px-6 py-4">
          {selectedEvents.length
            ? selectedEvents.map((event, i) => (
                <motion.div key={event.id} custom={i} variants={rowVariants} initial={reduceMotion ? false : 'hidden'} animate="show">
                  <EventRow
                    event={event}
                    onToggle={() => toggleEvent(event)}
                    onNotes={(notes) => saveNotes(event, notes)}
                    onEdit={() => openEdit(event)}
                    onDelete={() => setEventToDelete(event)}
                    full
                  />
                </motion.div>
              ))
            : <p className="py-8 text-center text-sm text-zinc-500">Nothing scheduled</p>}
        </div>
        <div className="border-t p-4">
          <Button size="sm" className="w-full" disabled={!activePlan} onClick={openAdd}><Plus className="h-4 w-4" /> Add task</Button>
        </div>
      </SheetContent>
    </Sheet>

    {/* Add / edit task dialog */}
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit task' : 'Add task'}</DialogTitle>
          <DialogDescription>{editing ? 'Changes are saved to this schedule.' : 'Adds a task to this schedule.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Title</span>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" autoFocus />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Date</span>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Category</span>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="General" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Start (optional)</span>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">End (optional)</span>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add a note…"
              className="min-h-16 w-full resize-y rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
        </div>
        {formError && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button size="sm" disabled={formBusy} onClick={() => void saveTask()}>
            {formBusy && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete task confirmation */}
    <Dialog open={!!eventToDelete} onOpenChange={(open) => { if (!open) setEventToDelete(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete “{eventToDelete?.title}”?</DialogTitle>
          <DialogDescription>This can’t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setEventToDelete(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" disabled={deleteTask.isPending} onClick={() => void confirmDeleteTask()}>
            {deleteTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Import dialog */}
    <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) resetImport(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import schedule</DialogTitle>
          <DialogDescription>{pending ? 'Name this schedule, then import.' : 'Week/Day CSVs import as all-day events.'}</DialogDescription>
        </DialogHeader>

        {!pending ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:border-muted-foreground/40">
            <FileUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Choose CSV file</span>
            <span className="text-xs text-muted-foreground">Date, Start Time, End Time, Category, Task, Status, Notes</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" disabled={importBusy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void chooseFile(file); }} />
          </label>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tabular-nums">{pending.fileName} · {pending.drafts.length} events</p>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Name</span>
              <Input value={importName} onChange={(e) => setImportName(e.target.value)} placeholder="Schedule name" autoFocus />
            </label>
            {pending.format === 'legacy' && (
              <label className="block space-y-1.5">
                <span className="text-xs text-muted-foreground">Start date for Day 1</span>
                <Input type="date" value={importStart} onChange={(e) => setImportStart(e.target.value)} />
              </label>
            )}
          </div>
        )}

        {importBusy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {pending ? 'Importing…' : 'Reading file…'}</div>}
        {importError && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{importError}</p>}
        <DialogFooter className="items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Creates a new tab. Nothing is replaced.</p>
          {pending && <Button size="sm" disabled={importBusy} onClick={() => void confirmImport()}>Import</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete plan dialog */}
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {activePlan?.name}?</DialogTitle>
          <DialogDescription>This removes the plan and its events. It cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => { if (activePlan) deletePlan.mutate(activePlan.scheduleId); setDeleteOpen(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />
      <h2 className="mt-3 font-semibold">No calendar plans yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Import your first CSV to create a schedule tab. Different plans can have different dates and time patterns.</p>
      <Button size="sm" className="mt-5" onClick={onImport}><FileUp className="h-4 w-4" /> Import CSV</Button>
    </div>
  );
}