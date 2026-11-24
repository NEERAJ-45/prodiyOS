import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import SchedulePlan from '@/lib/models/SchedulePlan';
import type { ScheduleEvent } from '@/lib/schedule-plans/types';

export async function POST(request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as ScheduleEvent | null;
  if (!body?.id || !body.title?.trim() || !body.date) return NextResponse.json({ error: 'id, title and date are required' }, { status: 400 });
  if (!(await connectToDatabase())) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });

  const plan = await SchedulePlan.findOne({ scheduleId, userEmail: email });
  if (!plan) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  plan.events.push({ ...body, title: body.title.trim() });
  await plan.save();
  return NextResponse.json({ plan }, { status: 201 });
}
