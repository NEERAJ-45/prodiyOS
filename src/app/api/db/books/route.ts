import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectToDatabase } from '@/lib/db';
import Book from '@/lib/models/Book';
import { logActivity } from '@/lib/activity-logger';
function getErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

function getEmail(request: Request): string {
  const { searchParams } = new URL(request.url);
  return searchParams.get('userEmail') || request.headers.get('x-user-email') || '';
}

function getDbUri(request: Request): string | undefined {
  return request.headers.get('x-mongodb-url') || undefined;
}

async function savePdf(file: File, bookId: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'books');
  await mkdir(uploadDir, { recursive: true });
  const ext = file.name.endsWith('.pdf') ? '.pdf' : '.pdf';
  const filename = `${bookId}${ext}`;
  const filePath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));
  return `uploads/books/${filename}`;
}

export async function GET(request: Request) {
  try {
    const userEmail = getEmail(request);
    if (!userEmail) {
      return NextResponse.json({ books: [] });
    }

    const conn = await connectToDatabase(getDbUri(request));
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
    const contentType = request.headers.get('content-type') || '';
    let userEmail: string;
    let bookData: Record<string, unknown>;
    let pdfFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      userEmail = formData.get('userEmail') as string || '';
      pdfFile = formData.get('pdf') as File | null;
      bookData = {
        title: formData.get('title') as string || '',
        author: formData.get('author') as string || '',
        status: formData.get('status') as string || 'TO_READ',
        progress: parseInt(formData.get('progress') as string || '0', 10),
        rating: parseInt(formData.get('rating') as string || '0', 10),
      };
    } else {
      const body = await request.json();
      userEmail = body.userEmail || '';
      bookData = body;
      delete bookData.userEmail;
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const bookId = (bookData.id as string) || `b-${Date.now()}`;
    let pdfPath: string | undefined;

    if (pdfFile) {
      pdfPath = await savePdf(pdfFile, bookId);
    }

    const book = await Book.create({
      ...bookData,
      id: bookId,
      pdfPath,
      userEmail,
    });

    logActivity(userEmail, `Added book "${bookData.title}"`);

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error);
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

    const conn = await connectToDatabase(getDbUri(request));
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
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Book.findOne({ id });
    if (existing) {
      logActivity(existing.userEmail, `Deleted book "${existing.title}"`);
    }

    await Book.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return getErrorResponse(error);
  }
}
