'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchedulePlansQuery, useUpdateScheduleEvent } from '@/hooks/use-schedule-plans';
import { parseDateKey } from '@/lib/schedule-plans/date-mapping';
import { cn } from '@/lib/utils';

function weekKeys(): string[] {
  const base = new Date();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });
}

export default function WeeklyPage() {
  const dates = React.useMemo(() => weekKeys(), []);
  const { data, isLoading } = useSchedulePlansQuery();
  const update = useUpdateScheduleEvent();
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const byDate = React.useMemo(() => {
    const map = new Map<string, { scheduleId: string; planName: string; event: NonNullable<typeof data>['plans'][number]['events'][number] }[]>();
    for (const plan of data?.plans ?? []) {
      for (const event of plan.events) {
        if (!dates.includes(event.date)) continue;
        const list = map.get(event.date) ?? [];
        list.push({ scheduleId: plan.scheduleId, planName: plan.name, event });
        map.set(event.date, list);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.event.startTime ?? '').localeCompare(b.event.startTime ?? ''));
    }
    return map;
  }, [data, dates]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Week</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseDateKey(dates[0]), 'MMM d')} – {format(parseDateKey(dates[6]), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Link
            href="/plan/calendar"
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border bg-card hover:bg-muted transition-colors"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Edit in calendar
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {dates.map((date) => {
              const events = byDate.get(date) ?? [];
              const isToday = date === todayKey;
              return (
                <Card key={date} className={cn(isToday && 'ring-1 ring-primary/50 border-primary/30')}>
                  <CardHeader className={cn('p-3 pb-2', isToday && 'bg-primary/5')}>
                    <CardTitle className={cn('text-sm font-medium', isToday ? 'text-primary' : 'text-foreground')}>
                      {format(parseDateKey(date), 'EEE d')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {events.length === 0 && <p className="text-xs text-muted-foreground">Nothing planned</p>}
                    {events.map(({ scheduleId, planName, event }) => (
                      <div key={event.id} className="flex items-start gap-2">
                        <button
                          type="button"
                          aria-pressed={event.completed}
                          aria-label={event.completed ? 'Mark not done' : 'Mark done'}
                          onClick={() => update.mutate({ scheduleId, eventId: event.id, completed: !event.completed })}
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                            event.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground',
                          )}
                        >
                          {event.completed && <Check className="h-3 w-3" />}
                        </button>
                        <div className="min-w-0">
                          <p className={cn('text-xs leading-snug break-words', event.completed && 'text-muted-foreground line-through')}>
                            {event.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {event.startTime ?? planName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && byDate.size === 0 && (
          <p className="text-sm text-muted-foreground">
            No calendar events this week. <Link href="/plan/calendar" className="underline hover:text-foreground">Add some in the calendar.</Link>
          </p>
        )}
      </div>
    </div>
  );
}
