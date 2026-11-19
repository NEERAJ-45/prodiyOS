'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { useSchedulePlansQuery, useUpdateScheduleEvent } from '@/hooks/use-schedule-plans';
import { parseDateKey } from '@/lib/schedule-plans/date-mapping';
import { cn } from '@/lib/utils';

export function PlanEvents({ dates }: { dates: string[] }) {
  const { data } = useSchedulePlansQuery();
  const update = useUpdateScheduleEvent();
  const wanted = new Set(dates);
  const rows = (data?.plans ?? []).flatMap((plan) =>
    plan.events.filter((event) => wanted.has(event.date)).map((event) => ({ plan, event })),
  );

  if (!rows.length) return null;

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">Calendar plans</h2>
        <Link href="/plan/calendar" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
          Open calendar
        </Link>
      </div>
      <ul className="divide-y">
        {rows.map(({ plan, event }) => (
          <li key={`${plan.scheduleId}:${event.id}`} className="flex items-start gap-3 py-2">
            <button
              type="button"
              aria-pressed={event.completed}
              aria-label={event.completed ? 'Mark not done' : 'Mark done'}
              onClick={() => update.mutate({ scheduleId: plan.scheduleId, eventId: event.id, completed: !event.completed })}
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                event.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground',
              )}
            >
              {event.completed && <Check className="h-3 w-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm', event.completed && 'text-muted-foreground line-through')}>{event.title}</p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {dates.length > 1 && <>{format(parseDateKey(event.date), 'EEE, MMM d')} · </>}
                {event.startTime && <>{event.startTime}{event.endTime ? `–${event.endTime}` : ''} · </>}
                {plan.name}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
