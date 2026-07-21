import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Bookmark from '@/lib/models/Bookmark';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const userEmail = searchParams.get('userEmail');

    if (!bookId || !userEmail) {
      return NextResponse.json({ error: 'bookId and userEmail required' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) return NextResponse.json({ bookmarks: [] });

    const bookmarks = await Bookmark.find({ bookId, userEmail }).sort({ pageNumber: 1 }).lean();
    return NextResponse.json({ bookmarks });
  } catch {
    return NextResponse.json({ bookmarks: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, bookId, pageNumber, note, userEmail } = body;

    if (!id || !bookId || !pageNumber || !userEmail) {
      return NextResponse.json({ error: 'id, bookId, pageNumber, and userEmail required' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    await Bookmark.findOneAndUpdate(
      { id },
      { id, bookId, pageNumber, note: note || '', userEmail },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    await Bookmark.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
