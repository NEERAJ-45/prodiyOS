import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import LoginAttempt from '@/lib/models/LoginAttempt';

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const daySet = new Set(dates.map((d) => d.split('T')[0]));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const yesterStr = yest.toISOString().split('T')[0];
  if (!daySet.has(todayStr) && !daySet.has(yesterStr)) return 0;
  let streak = 0;
  const cur = new Date(daySet.has(todayStr) ? today : yest);
  while (daySet.has(cur.toISOString().split('T')[0])) { streak++; cur.setDate(cur.getDate() - 1); }
  return streak;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const attempts = await LoginAttempt.find({
      userEmail: session.user.email,
      success:   true,
      timestamp: { $gte: ninetyDaysAgo },
    }).sort({ timestamp: 1 }).lean();

    const dates = attempts.map((a: any) => new Date(a.timestamp).toISOString());
    const streak = computeStreak(dates);
    const totalLoginDays = new Set(dates.map((d) => d.split('T')[0])).size;

    return NextResponse.json({ streak, totalLoginDays });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
