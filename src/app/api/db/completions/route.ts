import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { ICompletion } from '@/lib/models/Completion';
import '@/lib/models/Completion';
import { auth } from '@/auth';
import { logActivity } from '@/lib/activity-logger';

function humanizePrefix(storagePrefix: string): string {
  return storagePrefix
    .replace(/-completed$/, '')
    .replace(/-progress$/, '')
    .replace(/-checklist$/, '')
    .replace(/-questions$/, '')
    .replace(/-topics$/, '')
    .replace(/-custom$/, '')
    .replace(/-/g, ' ');
}


export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ dbConnected: false, data: [] });
    }
    const Completion = conn.model<ICompletion>('Completion');
    const list = await Completion.find({ userEmail });
    return NextResponse.json({ dbConnected: true, data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('[API/completions] Connection error:', message);
    return NextResponse.json({ dbConnected: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ dbConnected: false, error: 'Database not configured' }, { status: 400 });
    }
    const body = await request.json();
    const { storagePrefix, itemId, completedAt, resetAll } = body;

    if (resetAll) {
      if (!storagePrefix) {
        return NextResponse.json({ error: 'Missing storagePrefix' }, { status: 400 });
      }
      const Completion = conn.model<ICompletion>('Completion');
      await Completion.deleteMany({ storagePrefix, userEmail });
      return NextResponse.json({ success: true, deleted: true });
    }

    if (!storagePrefix || !itemId) {
      return NextResponse.json({ error: 'Missing storagePrefix or itemId' }, { status: 400 });
    }

    const { title } = body;
    const sectionName = humanizePrefix(storagePrefix);
    const displayName = title || `#${itemId}`;

    const Completion = conn.model<ICompletion>('Completion');
    if (completedAt) {
      const doc = await Completion.findOneAndUpdate(
        { storagePrefix, itemId, userEmail },
        { completedAt },
        { upsert: true, new: true }
      );
      logActivity(userEmail, `Completed "${displayName}" in ${sectionName}`);
      return NextResponse.json({ success: true, data: doc });
    } else {
      await Completion.deleteOne({ storagePrefix, itemId, userEmail });
      return NextResponse.json({ success: true, deleted: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
