import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';
import { connectToDatabase } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import LoginAttempt from '@/lib/models/LoginAttempt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, role, password, resetPin } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, name, and password are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Profile.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const resetPinHash = resetPin ? await bcrypt.hash(String(resetPin), 10) : undefined;

    const user = await Profile.create({
      email,
      name,
      role: role || 'Software Engineer',
      password: passwordHash,
      resetPin: resetPinHash,
    });

    // Log the registration as a successful login attempt
    await LoginAttempt.create({ userEmail: email, success: true, timestamp: new Date() });

    return NextResponse.json({
      success: true,
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('[API/auth/register]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
