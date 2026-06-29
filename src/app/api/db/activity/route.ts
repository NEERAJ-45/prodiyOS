import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

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
