'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useSchedulePlansQuery, useUpdateScheduleEvent } from '@/hooks/use-schedule-plans';
import { dateKey, parseDateKey } from '@/lib/schedule-plans/date-mapping';

export function MissedSlots() {
  const { data } = useSchedulePlansQuery();
  const update = useUpdateScheduleEvent();
  const [open, setOpen] = React.useState(true);
  const today = dateKey(new Date());

  const rows = React.useMemo(() => {
    const list = (data?.plans ?? []).flatMap((plan) =>
      plan.events.filter((event) => event.date < today && !event.completed).map((event) => ({ plan, event })),
    );
    return list.sort(
      (a, b) =>
        b.event.date.localeCompare(a.event.date) ||
        (a.event.startTime ?? '99:99').localeCompare(b.event.startTime ?? '99:99'),
    );
  }, [data, today]);

  if (!rows.length) return null;

  return (
    <section className="rounded-xl border bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Catch-up ({rows.length} missed slot{rows.length === 1 ? '' : 's'})
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <ul className="mt-2 max-h-64 divide-y overflow-y-auto">
          {rows.map(({ plan, event }) => (
            <li key={`${plan.scheduleId}:${event.id}`} className="flex items-start gap-3 py-2">
              <button
                type="button"
                aria-label="Mark done"
                onClick={() =>
                  update.mutate({ scheduleId: plan.scheduleId, eventId: event.id, completed: true })
                }
                className="group mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border transition-colors hover:border-muted-foreground hover:bg-muted"
              >
                <Check className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{event.title}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">
                  {format(parseDateKey(event.date), 'EEE, MMM d')}
                  {event.startTime && (
                    <>
                      {' · '}
                      {event.startTime}
                      {event.endTime ? `–${event.endTime}` : ''}
                    </>
                  )}
                  {' · '}
                  {plan.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
