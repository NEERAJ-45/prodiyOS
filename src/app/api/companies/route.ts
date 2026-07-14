import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/lib/models/Company';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || '';

    if (!userEmail) {
      return NextResponse.json({ companies: [] });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ companies: [] });
    }

    const companies = await Company.find({ userEmail }).sort({ name: 1 }).lean();
    return NextResponse.json({ companies });
  } catch {
    return NextResponse.json({ companies: [] });
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

    const company = await Company.create({
      ...data,
      id: data.id || `comp-${Date.now()}`,
      userEmail,
    });

    logActivity(userEmail, `Added company "${data.name}"`);

    return NextResponse.json({ company }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
