import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { connectToDatabase } from '@/lib/db';
import BookContent from '@/lib/models/BookContent';
import { extractTextFromPdfBuffer } from '@/lib/pdf-extractor';
import books from '@/data/books';

const BOOKS_DIR = join(process.cwd(), 'src', 'assets', 'Being-Backend-Prodigy');

export async function POST() {
  const log = (msg: string, ...args: unknown[]) => console.error(`[index-library] ${msg}`, ...args);

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      log('Database unavailable — no MONGODB_URI configured');
      return NextResponse.json({ error: 'Database unavailable — no MONGODB_URI configured', detail: 'Check .env.local MONGODB_URI_HOME or MONGODB_URI_OFFICE' }, { status: 503 });
    }

    const bookIds = books.map((b) => b.slug);
    const existingDocs = await BookContent.find({ bookId: { $in: bookIds }, sourceType: 'library' }).select('bookId').lean();
    const existingSet = new Set(existingDocs.map((d) => d.bookId));

    let indexed = 0;
    let skipped = 0;
    let errors: { slug: string; reason: string }[] = [];

    for (const book of books) {
      if (existingSet.has(book.slug)) {
        skipped++;
        continue;
      }

      const filePath = join(BOOKS_DIR, book.path);
      let buffer: Buffer;
      try {
        buffer = await readFile(filePath);
      } catch (e) {
        const reason = `readFile failed: ${(e as Error).message}`;
        log(`${book.slug}: ${reason}`);
        errors.push({ slug: book.slug, reason });
        continue;
      }

      const text = await extractTextFromPdfBuffer(buffer);
      const cleanText = text
        .replace(/\s+/g, ' ')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .trim();

      if (cleanText.length < 20) {
        const reason = `extracted text too short (${cleanText.length} chars)`;
        log(`${book.slug}: ${reason}`);
        errors.push({ slug: book.slug, reason });
        continue;
      }

      try {
        await BookContent.findOneAndUpdate(
          { bookId: book.slug, sourceType: 'library' },
          {
            bookId: book.slug,
            sourceType: 'library',
            title: book.title,
            author: '',
            category: book.category,
            content: cleanText.slice(0, 50000),
            contentLength: cleanText.length,
            indexedAt: new Date(),
          },
          { upsert: true }
        );
        indexed++;
      } catch (e) {
        const reason = `upsert failed: ${(e as Error).message}`;
        log(`${book.slug}: ${reason}`);
        errors.push({ slug: book.slug, reason });
      }
    }

    return NextResponse.json({ indexed, skipped, errors, total: books.length });
  } catch (e) {
    const message = (e as Error).message;
    const stack = process.env.NODE_ENV === 'development' ? (e as Error).stack : undefined;
    log('Fatal:', message, stack ?? '');
    return NextResponse.json({ error: 'Indexing failed', detail: message, stack }, { status: 500 });
  }
}

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ indexed: 0, total: books.length });
    }

    const indexed = await BookContent.countDocuments({ sourceType: 'library' });
    return NextResponse.json({ indexed, total: books.length });
  } catch {
    return NextResponse.json({ indexed: 0, total: books.length });
  }
}
