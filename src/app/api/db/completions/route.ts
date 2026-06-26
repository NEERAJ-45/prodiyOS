import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Completion from '@/lib/models/Completion';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ dbConnected: false, data: [] });
    }
    const list = await Completion.find({});
    return NextResponse.json({ dbConnected: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ dbConnected: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ dbConnected: false, error: 'Database not configured' }, { status: 400 });
    }
    const body = await request.json();
    const { storagePrefix, itemId, completedAt } = body;

    if (!storagePrefix || !itemId) {
      return NextResponse.json({ error: 'Missing storagePrefix or itemId' }, { status: 400 });
    }

    if (completedAt) {
      const doc = await Completion.findOneAndUpdate(
        { storagePrefix, itemId },
        { completedAt },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, data: doc });
    } else {
      await Completion.deleteOne({ storagePrefix, itemId });
      return NextResponse.json({ success: true, deleted: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
