import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';
import { connectToDatabase } from '@/lib/db';
import Profile from '@/lib/models/Profile';

export async function POST(request: Request) {
  try {
    const { email, pin, newPassword } = await request.json();

    if (!email || !pin || !newPassword) {
      return NextResponse.json({ error: 'email, pin, and newPassword are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await Profile.findOne({ email });
    if (!user || !user.resetPin) {
      return NextResponse.json({ error: 'No reset PIN configured for this account.' }, { status: 404 });
    }

    const pinValid = await bcrypt.compare(String(pin), user.resetPin);
    if (!pinValid) {
      return NextResponse.json({ error: 'Invalid reset PIN.' }, { status: 401 });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('[API/auth/reset]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
