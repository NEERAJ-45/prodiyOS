import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Book from '@/lib/models/Book';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || '';

    if (!userEmail) {
      return NextResponse.json({ books: [] });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ books: [] });
    }

    const books = await Book.find({ userEmail }).sort({ id: -1 }).lean();
    return NextResponse.json({ books });
  } catch {
    return NextResponse.json({ books: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, ...bookData } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const book = await Book.create({
      ...bookData,
      id: bookData.id || `b-${Date.now()}`,
      userEmail,
    });

    logActivity(userEmail, `Added book "${bookData.title}"`);

    return NextResponse.json({ book }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Book.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const book = await Book.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    logActivity(existing.userEmail, `Updated book "${book.title}"`);

    return NextResponse.json({ book });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Book.findOne({ id });
    if (existing) {
      logActivity(existing.userEmail, `Deleted book "${existing.title}"`);
    }

    await Book.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
