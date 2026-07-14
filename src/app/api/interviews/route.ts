import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Application from '@/lib/models/Application';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || '';

    if (!userEmail) {
      return NextResponse.json({ applications: [] });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ applications: [] });
    }

    const applications = await Application.find({ userEmail }).sort({ appliedDate: -1 }).lean();
    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ applications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, ...data } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const application = await Application.create({
      ...data,
      id: data.id || `app-${Date.now()}`,
      userEmail,
      appliedDate: new Date(data.appliedDate),
      nextRoundDate: data.nextRoundDate ? new Date(data.nextRoundDate) : null,
    });

    logActivity(userEmail, `Applied to ${data.company} for ${data.role}`);

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
