import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Revision from '@/lib/models/Revision';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ dbConnected: false, data: [] });
    }
    const list = await Revision.find({});
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
    const { id, concept, stage, dueDate, completed } = body;

    if (!id || !concept || stage === undefined || !dueDate) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const doc = await Revision.findOneAndUpdate(
      { id },
      { concept, stage, dueDate, completed: !!completed },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ dbConnected: false, error: 'Database not configured' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await Revision.deleteOne({ id });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
