import { NextResponse } from 'next/server';
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

    const book = await Book.findOne({ id }).select('+pdfData title').lean();
    if (!book || !book.pdfData) {
      return NextResponse.json({ error: 'Book or PDF not found' }, { status: 404 });
    }

    const pdfBytes = new Uint8Array(book.pdfData.buffer);

    return new NextResponse(pdfBytes as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${book.title}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 });
  }
}
