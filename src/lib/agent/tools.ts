import DailyRecord from '@/lib/models/DailyRecord';
import SchedulePlan from '@/lib/models/SchedulePlan';
import type { ToolResult } from './types';

export interface ToolContext {
  email: string;
  today: string;
}

const MAX_EVENTS = 200;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type PlanEvent = {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  title: string;
  category?: string;
  completed: boolean;
  status: string;
  notes?: string;
};

async function findPlanEvent(ctx: ToolContext, eventId: string) {
  return SchedulePlan.findOne({ userEmail: ctx.email, 'events.id': eventId });
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'get_today_plan': {
        const [record, plans] = await Promise.all([
          DailyRecord.findOne({ date: ctx.today, userEmail: ctx.email }).lean(),
          SchedulePlan.find({ userEmail: ctx.email }).lean(),
        ]);
        const events = (plans as Array<{ name: string; scheduleId: string; events: PlanEvent[] }>).flatMap((plan) =>
          plan.events
            .filter((event) => event.date === ctx.today)
            .map((event) => ({
              planName: plan.name,
              scheduleId: plan.scheduleId,
              eventId: event.id,
              title: event.title,
              time: event.startTime ? `${event.startTime}${event.endTime ? `-${event.endTime}` : ''}` : null,
              done: event.completed,
            })),
        );
        return {
          ok: true,
          data: {
            date: ctx.today,
            events,
            completedTaskIds: (record as { completedTaskIds?: string[] } | null)?.completedTaskIds ?? [],
          },
        };
      }

      case 'list_plan_events': {
        const from = typeof args.from === 'string' && DATE_RE.test(args.from) ? args.from : ctx.today;
        const to = typeof args.to === 'string' && DATE_RE.test(args.to) ? args.to : from;
        const plans = await SchedulePlan.find({ userEmail: ctx.email }).lean();
        const events = (plans as Array<{ name: string; scheduleId: string; events: PlanEvent[] }>)
          .flatMap((plan) =>
            plan.events
              .filter((event) => event.date >= from && event.date <= to)
              .map((event) => ({
                planName: plan.name,
                scheduleId: plan.scheduleId,
                eventId: event.id,
                date: event.date,
                title: event.title,
                time: event.startTime ? `${event.startTime}${event.endTime ? `-${event.endTime}` : ''}` : null,
                done: event.completed,
              })),
          )
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, MAX_EVENTS);
        return { ok: true, data: { from, to, count: events.length, events } };
      }

      case 'set_event_done': {
        const eventId = String(args.eventId ?? '');
        const done = args.done === true;
        if (!eventId) return { ok: false, error: 'eventId is required' };
        const plan = await findPlanEvent(ctx, eventId);
        if (!plan) return { ok: false, error: 'Event not found' };
        const event = plan.events.find((item: PlanEvent) => item.id === eventId);
        if (!event) return { ok: false, error: 'Event not found' };
        event.completed = done;
        event.status = done ? 'Done' : 'Pending';
        await plan.save();
        return { ok: true, data: { eventId, title: event.title, done } };
      }

      case 'add_event_note': {
        const eventId = String(args.eventId ?? '');
        const note = String(args.note ?? '');
        if (!eventId) return { ok: false, error: 'eventId is required' };
        const plan = await findPlanEvent(ctx, eventId);
        if (!plan) return { ok: false, error: 'Event not found' };
        const event = plan.events.find((item: PlanEvent) => item.id === eventId);
        if (!event) return { ok: false, error: 'Event not found' };
        event.notes = note;
        await plan.save();
        return { ok: true, data: { eventId, title: event.title, note } };
      }

      default:
        return { ok: false, error: `Unknown tool ${name}` };
    }
  } catch (caught) {
    return { ok: false, error: caught instanceof Error ? caught.message : 'Tool failed' };
  }
}
