import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Profile from '@/lib/models/Profile';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    await connectToDatabase();
    const profile = await Profile.findOne({ email }).select('onboarded onboardingData');

    return NextResponse.json({
      onboarded: profile?.onboarded ?? false,
      onboardingData: profile?.onboardingData ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, onboardingData, scheduleMode } = body;

    if (!email || !onboardingData) {
      return NextResponse.json({ error: 'email and onboardingData are required.' }, { status: 400 });
    }

    await connectToDatabase();

    await Profile.updateOne(
      { email },
      {
        $set: {
          onboarded: true,
          onboardingData,
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
