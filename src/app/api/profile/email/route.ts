import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';
import { connectToDatabase } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import LoginAttempt from '@/lib/models/LoginAttempt';

export async function PATCH(request: Request) {
  try {
    const { currentEmail, newEmail, password } = await request.json();

    if (!currentEmail || !newEmail || !password) {
      return NextResponse.json({ error: 'currentEmail, newEmail, and password are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (currentEmail === newEmail) {
      return NextResponse.json({ error: 'New email matches current email' }, { status: 400 });
    }

    await connectToDatabase();

    const profile = await Profile.findOne({ email: currentEmail });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, profile.password as string);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const existing = await Profile.findOne({ email: newEmail });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    await Profile.updateOne({ email: currentEmail }, { $set: { email: newEmail } });
    await LoginAttempt.updateMany({ userEmail: currentEmail }, { $set: { userEmail: newEmail } });

    return NextResponse.json({ success: true, message: 'Email updated — please sign in again' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
