import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { IActivity } from '@/lib/models/Activity';
import '@/lib/models/Activity';
import { logActivity } from '@/lib/activity-logger';
import Activity from '@/lib/models/Activity';

export async function POST(request: Request) {
  try {
    const { userEmail, text } = await request.json();
    if (!userEmail || !text) {
      return NextResponse.json({ error: 'userEmail and text required' }, { status: 400 });
    }
    await logActivity(userEmail, text);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    await connectToDatabase();
    const activities = await Activity.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      activities: activities.map((a: any) => ({ text: a.text, createdAt: a.createdAt })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
