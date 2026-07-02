import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import InterviewRound from '@/lib/models/InterviewRound';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await InterviewRound.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (body.date) body.date = new Date(body.date);

    const round = await InterviewRound.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ round });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    await InterviewRound.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
