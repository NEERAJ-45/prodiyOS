import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Application from '@/lib/models/Application';
import InterviewRound from '@/lib/models/InterviewRound';
import Company from '@/lib/models/Company';
import { logActivity } from '@/lib/activity-logger';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || '';

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const appResult = await Application.deleteMany({ userEmail });
    const roundResult = await InterviewRound.deleteMany({ userEmail });
    const compResult = await Company.deleteMany({ userEmail });

    logActivity(userEmail, `Reset interview tracker (${appResult.deletedCount} apps, ${roundResult.deletedCount} rounds, ${compResult.deletedCount} companies)`);

    return NextResponse.json({
      success: true,
      deleted: {
        applications: appResult.deletedCount,
        rounds: roundResult.deletedCount,
        companies: compResult.deletedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
