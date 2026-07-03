import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { INote } from '@/lib/models/Note';
import '@/lib/models/Note';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || 'NEERAJ';
    const customUri = request.headers.get('x-mongodb-url') || undefined;

    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ dbConnected: false, data: [] });
    }
    const Note = conn.model<INote>('Note');
    const list = await Note.find({ userEmail });
    return NextResponse.json({ dbConnected: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ dbConnected: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ dbConnected: false, error: 'Database not configured' }, { status: 400 });
    }
    const body = await request.json();
    const { storagePrefix, itemId, note, resetAll, itemTitle } = body;
    const userEmail = body.userEmail || request.headers.get('x-user-email') || 'NEERAJ';

    if (resetAll) {
      if (!storagePrefix) {
        return NextResponse.json({ error: 'Missing storagePrefix' }, { status: 400 });
      }
      const Note = conn.model<INote>('Note');
      await Note.deleteMany({ storagePrefix, userEmail });
      logActivity(userEmail, `Reset all notes in ${storagePrefix}`);
      return NextResponse.json({ success: true, deleted: true });
    }

    if (!storagePrefix || !itemId) {
      return NextResponse.json({ error: 'Missing storagePrefix or itemId' }, { status: 400 });
    }

    const Note = conn.model<INote>('Note');
    if (note) {
      const doc = await Note.findOneAndUpdate(
        { storagePrefix, itemId, userEmail },
        { note },
        { upsert: true, new: true }
      );
      logActivity(userEmail, `Added note to "${itemTitle || itemId}" in ${storagePrefix}`);
      return NextResponse.json({ success: true, data: doc });
    } else {
      await Note.deleteOne({ storagePrefix, itemId, userEmail });
      logActivity(userEmail, `Removed note from "${itemTitle || itemId}" in ${storagePrefix}`);
      return NextResponse.json({ success: true, deleted: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
