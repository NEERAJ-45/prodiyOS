import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import SchedulePlan from '@/lib/models/SchedulePlan';

type EventFields = Partial<{ title: string; date: string; category: string; startTime: string | null; endTime: string | null; notes: string | null }>;

async function load(request: Request, scheduleId: string, eventId: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!(await connectToDatabase())) return { error: NextResponse.json({ error: 'Database is not configured' }, { status: 503 }) };
  const plan = await SchedulePlan.findOne({ scheduleId, userEmail: email });
  if (!plan) return { error: NextResponse.json({ error: 'Schedule not found' }, { status: 404 }) };
  const event = plan.events.find((item: { id: string }) => item.id === eventId);
  if (!event) return { error: NextResponse.json({ error: 'Event not found' }, { status: 404 }) };
  return { plan, event };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ scheduleId: string; eventId: string }> }) {
  const { scheduleId, eventId } = await params;
  const found = await load(request, scheduleId, eventId);
  if ('error' in found) return found.error;

  const fields = await request.json().catch(() => null) as EventFields | null;
  if (!fields) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { title, date, category, startTime, endTime, notes } = fields;
  if (title !== undefined) found.event.title = title.trim();
  if (date !== undefined) found.event.date = date;
  if (category !== undefined) found.event.category = category;
  if (startTime !== undefined) found.event.startTime = startTime ?? undefined;
  if (endTime !== undefined) found.event.endTime = endTime ?? undefined;
  if (notes !== undefined) found.event.notes = notes ?? undefined;

  await found.plan.save();
  return NextResponse.json({ plan: found.plan });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ scheduleId: string; eventId: string }> }) {
  const { scheduleId, eventId } = await params;
  const found = await load(request, scheduleId, eventId);
  if ('error' in found) return found.error;

  found.plan.events = found.plan.events.filter((item: { id: string }) => item.id !== eventId);
  await found.plan.save();
  return NextResponse.json({ plan: found.plan });
}
