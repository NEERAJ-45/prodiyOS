import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { connectToDatabase } from '@/lib/db';
import BookContent from '@/lib/models/BookContent';
import { extractTextFromPdfBuffer } from '@/lib/pdf-extractor';
import books from '@/data/books';

const BOOKS_DIR = join(process.cwd(), 'src', 'assets', 'Being-Backend-Prodigy');

export async function POST() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    for (const book of books) {
      try {
        const existing = await BookContent.findOne({ bookId: book.slug, sourceType: 'library' });
        if (existing) {
          skipped++;
          continue;
        }

        const filePath = join(BOOKS_DIR, book.path);

        let buffer: Buffer;
        try {
          buffer = await readFile(filePath);
        } catch (e) {
          console.error(`[index-library] readFile failed: ${book.path}`, (e as Error).message);
          errors++;
          continue;
        }

        const text = await extractTextFromPdfBuffer(buffer);
        const cleanText = text
          .replace(/\s+/g, ' ')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
          .trim();

        if (cleanText.length < 20) {
          console.error(`[index-library] text too short (${cleanText.length}) for ${book.path}`);
          errors++;
          continue;
        }

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
        console.error(`[index-library] upsert failed for ${book.slug}`, (e as Error).message);
        errors++;
      }
    }

    return NextResponse.json({ indexed, skipped, errors, total: books.length });
  } catch {
    return NextResponse.json({ error: 'Indexing failed' }, { status: 500 });
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
