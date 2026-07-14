import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import InterviewRound from '@/lib/models/InterviewRound';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || '';
    const applicationId = searchParams.get('applicationId');
    if (!userEmail) {
      return NextResponse.json({ rounds: [] });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ rounds: [] });
    }

    const filter: Record<string, string> = { userEmail };
    if (applicationId) filter.applicationId = applicationId;

    const rounds = await InterviewRound.find(filter).sort({ date: -1 }).lean();
    return NextResponse.json({ rounds });
  } catch {
    return NextResponse.json({ rounds: [] });
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

    const round = await InterviewRound.create({
      ...data,
      id: data.id || `rnd-${Date.now()}`,
      userEmail,
      date: new Date(data.date),
    });

    logActivity(userEmail, `Recorded ${data.roundType} interview`);

    return NextResponse.json({ round }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
