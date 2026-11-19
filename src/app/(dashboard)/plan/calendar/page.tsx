'use client';

import { useMemo, useState } from 'react';
import { addMonths, format, isSameDay, parseISO, subMonths } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, FileUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { datesForMonth, dateKey, parseDateKey } from '@/lib/schedule-plans/date-mapping';
import { applyLegacyStartDate, draftsToEvents, parseScheduleCsv } from '@/lib/schedule-plans/csv';
import type { ScheduleEvent } from '@/lib/schedule-plans/types';
import { useCreateSchedulePlan, useDeleteSchedulePlan, useSchedulePlansQuery, useUpdateScheduleEvent } from '@/hooks/use-schedule-plans';

const cellClass = 'min-h-28 rounded-lg border bg-card p-2 text-left transition hover:border-primary/50';

function EventChip({ event, onClick }: { event: ScheduleEvent; onClick: () => void }) {
  return <button onClick={onClick} className="mb-1 block w-full truncate rounded border border-primary/20 bg-primary/10 px-1.5 py-1 text-left text-[11px] hover:bg-primary/20" title={event.title}><span className="font-medium">{event.allDay ? 'All day' : event.startTime}</span> {event.title}</button>;
}

export default function CalendarPlansPage() {
  const { data, isLoading, error } = useSchedulePlansQuery();
  const createPlan = useCreateSchedulePlan();
  const updateEvent = useUpdateScheduleEvent();
  const deletePlan = useDeleteSchedulePlan();
  const plans = data?.plans ?? [];
  const [activeId, setActiveId] = useState<string>();
  const activePlan = plans.find((plan) => plan.scheduleId === activeId) ?? plans[0];
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [importBusy, setImportBusy] = useState(false);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of activePlan?.events ?? []) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    for (const events of map.values()) events.sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));
    return map;
  }, [activePlan]);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  async function importFile(file: File) {
    setImportBusy(true); setImportError('');
    try {
      const parsed = parseScheduleCsv(await file.text());
      if (parsed.errors.length) throw new Error(parsed.errors.join('. '));
      const name = window.prompt('Name this schedule', file.name.replace(/\.csv$/i, ''))?.trim();
      if (!name) return;
      let drafts = parsed.drafts;
      let startDate = '';
      if (parsed.format === 'legacy') {
        startDate = window.prompt('Start date for Day 1 (YYYY-MM-DD)', format(new Date(), 'yyyy-MM-dd'))?.trim() ?? '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('A valid start date is required for this legacy CSV.');
        drafts = applyLegacyStartDate(drafts, startDate);
      } else {
        startDate = drafts.map((draft) => draft.date!).sort()[0];
      }
      const events = draftsToEvents(drafts);
      const endDate = events.map((event) => event.date).sort().at(-1) ?? startDate;
      await createPlan.mutateAsync({ scheduleId: crypto.randomUUID(), name, sourceFileName: file.name, startDate, endDate, events });
      setImportOpen(false);
    } catch (caught) { setImportError(caught instanceof Error ? caught.message : 'Import failed'); }
    finally { setImportBusy(false); }
  }

  function toggleEvent(event: ScheduleEvent) { if (!activePlan) return; updateEvent.mutate({ scheduleId: activePlan.scheduleId, eventId: event.id, completed: !event.completed }); }
  function saveNotes(event: ScheduleEvent, notes: string) { if (!activePlan) return; updateEvent.mutate({ scheduleId: activePlan.scheduleId, eventId: event.id, notes }); }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading schedules…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">Could not load schedules: {error.message}</div>;

  return <div className="space-y-5 p-4 md:p-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><h1 className="text-2xl font-semibold tracking-tight">Calendar Plans</h1></div><p className="mt-1 text-sm text-muted-foreground">Keep independent schedules together without forcing them into one fixed plan.</p></div>
      <button onClick={() => { setImportError(''); setImportOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Import schedule</button>
    </header>

    {plans.length > 0 && <div className="flex gap-2 overflow-x-auto border-b pb-2">{plans.map((plan) => <button key={plan.scheduleId} onClick={() => { setActiveId(plan.scheduleId); setSelectedDate(plan.startDate); setMonth(parseDateKey(plan.startDate)); }} className={`shrink-0 rounded-md px-3 py-2 text-sm ${plan.scheduleId === activePlan?.scheduleId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{plan.name}</button>)}</div>}

    {!activePlan ? <EmptyState onImport={() => setImportOpen(true)} /> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{activePlan.name}</h2><p className="text-xs text-muted-foreground">{activePlan.events.length} events · {activePlan.sourceFileName} · events without times are all-day</p></div><button onClick={() => { if (window.confirm(`Delete “${activePlan.name}”?`)) deletePlan.mutate(activePlan.scheduleId); }} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Delete schedule</button></div>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl border bg-card p-3 md:p-5"><div className="mb-4 flex items-center justify-between"><button aria-label="Previous month" onClick={() => setMonth((value) => subMonths(value, 1))} className="rounded-md p-2 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button><h2 className="font-semibold">{format(month, 'MMMM yyyy')}</h2><button aria-label="Next month" onClick={() => setMonth((value) => addMonths(value, 1))} className="rounded-md p-2 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button></div><div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <span key={day}>{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{datesForMonth(month).map((date) => { const key = dateKey(date); const dayEvents = eventsByDate.get(key) ?? []; const inMonth = date.getMonth() === month.getMonth(); return <button key={key} onClick={() => setSelectedDate(key)} className={`${cellClass} ${!inMonth ? 'opacity-45' : ''} ${key === selectedDate ? 'ring-2 ring-primary' : ''}`}><div className="mb-1 text-xs font-semibold">{format(date, 'd')}</div>{dayEvents.slice(0, 3).map((event) => <EventChip key={event.id} event={event} onClick={() => setSelectedDate(key)} />)}{dayEvents.length > 3 && <span className="text-[11px] text-muted-foreground">+{dayEvents.length - 3} more</span>}</button>; })}</div></div>
        <aside className="rounded-xl border bg-card p-4"><h3 className="font-semibold">{format(parseDateKey(selectedDate), 'EEEE, MMM d')}</h3><p className="mb-4 text-xs text-muted-foreground">{selectedEvents.length ? `${selectedEvents.length} scheduled item${selectedEvents.length === 1 ? '' : 's'}` : 'No scheduled items'}</p><div className="space-y-4">{selectedEvents.map((event) => <div key={event.id} className="border-b pb-4 last:border-0"><div className="flex gap-2"><input type="checkbox" checked={event.completed} onChange={() => toggleEvent(event)} className="mt-1 h-4 w-4 accent-primary" /><div className="min-w-0 flex-1"><div className={`text-sm font-medium ${event.completed ? 'text-muted-foreground line-through' : ''}`}>{event.title}</div><div className="mt-1 text-xs text-muted-foreground">{event.category} · {event.allDay ? 'All day' : `${event.startTime}${event.endTime ? `–${event.endTime}` : ''}`}</div><textarea defaultValue={event.notes ?? ''} onBlur={(e) => { if (e.target.value !== (event.notes ?? '')) saveNotes(event, e.target.value); }} placeholder="Add a note…" className="mt-2 min-h-16 w-full resize-y rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" /></div></div></div>)}</div></aside>
      </section>
    </>}

    {importOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Import a schedule</h2><p className="mt-1 text-sm text-muted-foreground">Use the event format or the supplied Week/Day CSV. Legacy rows import as all-day events.</p></div><button onClick={() => setImportOpen(false)} className="text-muted-foreground">×</button></div><label className="mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center hover:border-primary"><FileUp className="h-8 w-8 text-primary" /><span className="text-sm font-medium">Choose CSV file</span><span className="text-xs text-muted-foreground">Date, Start Time, End Time, Category, Task, Status, Notes</span><input type="file" accept=".csv,text/csv" className="sr-only" disabled={importBusy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void importFile(file); }} /></label>{importBusy && <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Importing…</div>}{importError && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{importError}</p>}<p className="mt-4 text-xs text-muted-foreground">Each import creates a new tab. Nothing is replaced.</p></div></div>}
  </div>;
}

function EmptyState({ onImport }: { onImport: () => void }) { return <div className="rounded-xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 font-semibold">No calendar plans yet</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Import your first CSV to create a schedule tab. Different plans can have different dates and time patterns.</p><button onClick={onImport} className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><FileUp className="h-4 w-4" /> Import CSV</button></div>; }
