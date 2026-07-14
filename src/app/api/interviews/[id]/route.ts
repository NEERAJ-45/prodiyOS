import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Application from '@/lib/models/Application';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const application = await Application.findOne({ id }).lean();
    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { userEmail, ...updates } = body;

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Application.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (updates.appliedDate) updates.appliedDate = new Date(updates.appliedDate);
    if (updates.nextRoundDate !== undefined) {
      updates.nextRoundDate = updates.nextRoundDate ? new Date(updates.nextRoundDate) : null;
    }

    const application = await Application.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (updates.status && updates.status !== existing.status) {
      logActivity(existing.userEmail, `Application at ${existing.company} moved to ${updates.status}`);
    }

    return NextResponse.json({ application });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
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

    const existing = await Application.findOne({ id });
    if (existing) {
      logActivity(existing.userEmail, `Removed application at ${existing.company}`);
    }

    await Application.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
