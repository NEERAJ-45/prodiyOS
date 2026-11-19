import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import SchedulePlan from '@/lib/models/SchedulePlan';
import type { ScheduleEvent } from '@/lib/schedule-plans/types';

function publicPlan(plan: any) {
  return { scheduleId: plan.scheduleId, name: plan.name, sourceFileName: plan.sourceFileName, startDate: plan.startDate, endDate: plan.endDate, events: plan.events, createdAt: plan.createdAt, updatedAt: plan.updatedAt };
}
async function currentEmail() { const session = await auth(); return session?.user?.email ?? null; }

export async function GET() {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await connectToDatabase())) return NextResponse.json({ plans: [], error: 'Database is not configured' }, { status: 503 });
  const plans = await SchedulePlan.find({ userEmail: email }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ plans: plans.map(publicPlan) });
}

export async function POST(request: Request) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null) as Partial<{ name: string; sourceFileName: string; startDate: string; endDate: string; events: ScheduleEvent[] }> | null;
  if (!body?.name?.trim() || !Array.isArray(body.events) || !body.startDate || !body.endDate) return NextResponse.json({ error: 'Name, dates, and events are required' }, { status: 400 });
  if (!(await connectToDatabase())) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  const plan = await SchedulePlan.create({ scheduleId: randomUUID(), userEmail: email, name: body.name.trim(), sourceFileName: body.sourceFileName?.trim() || 'Imported schedule', startDate: body.startDate, endDate: body.endDate, events: body.events });
  return NextResponse.json({ plan: publicPlan(plan) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null) as { scheduleId?: string; eventId?: string; completed?: boolean; notes?: string; status?: string } | null;
  if (!body?.scheduleId || !body.eventId) return NextResponse.json({ error: 'scheduleId and eventId are required' }, { status: 400 });
  if (!(await connectToDatabase())) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  const plan = await SchedulePlan.findOne({ scheduleId: body.scheduleId, userEmail: email });
  if (!plan) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  const event = plan.events.find((item: { id: string }) => item.id === body.eventId);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (body.completed !== undefined) { event.completed = body.completed; event.status = body.completed ? 'Done' : 'Pending'; }
  if (body.status !== undefined) event.status = body.status;
  if (body.notes !== undefined) event.notes = body.notes;
  await plan.save();
  return NextResponse.json({ plan: publicPlan(plan) });
}

export async function DELETE(request: Request) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const scheduleId = new URL(request.url).searchParams.get('scheduleId');
  if (!scheduleId) return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 });
  if (!(await connectToDatabase())) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  await SchedulePlan.deleteOne({ scheduleId, userEmail: email });
  return NextResponse.json({ success: true });
}
