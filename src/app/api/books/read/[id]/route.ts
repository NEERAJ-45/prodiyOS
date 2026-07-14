import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { connectToDatabase } from '@/lib/db';
import Book from '@/lib/models/Book';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const book = await Book.findOne({ id }).lean();
    if (!book || !book.pdfPath) {
      return NextResponse.json({ error: 'Book or PDF not found' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', book.pdfPath);
    const bytes = await readFile(filePath);

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${book.title}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 });
  }
}
