import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import type { ITaskDoc } from '@/lib/models/TaskDoc';
import '@/lib/models/TaskDoc';
import { getDbUri } from '../request';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email || '';
    if (!userEmail) {
      return NextResponse.json({ dbConnected: false, data: [] });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ dbConnected: false, data: [] });
    }
    const TaskDoc = conn.model<ITaskDoc>('TaskDoc');
    const doc = await TaskDoc.findOne({ userEmail });
    return NextResponse.json({ dbConnected: true, data: doc?.tasks ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ dbConnected: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email || '';
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ dbConnected: false, error: 'Database not configured' }, { status: 400 });
    }
    const body = await request.json();
    const { tasks, updatedAt } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Missing tasks array' }, { status: 400 });
    }

    const TaskDoc = conn.model<ITaskDoc>('TaskDoc');
    const doc = await TaskDoc.findOneAndUpdate(
      { userEmail },
      { tasks, updatedAt: updatedAt ?? new Date().toISOString() },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, data: doc.tasks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
