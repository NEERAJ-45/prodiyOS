'use server';

import { connectToDatabase } from '@/lib/db';
import Book from '@/lib/models/Book';
import { logActivity } from '@/lib/activity-logger';

export async function createBook(formData: FormData) {
  try {
    const userEmail = formData.get('userEmail') as string;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string || '';
    const category = formData.get('category') as string || 'other';
    const status = formData.get('status') as string || 'TO_READ';
    const progress = parseInt(formData.get('progress') as string || '0', 10);
    const rating = parseInt(formData.get('rating') as string || '0', 10);
    const pdfFile = formData.get('pdf') as File | null;

    if (!userEmail || !title?.trim()) {
      return { error: 'userEmail and title required' };
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return { error: 'Database unavailable' };
    }

    const bookId = `b-${Date.now()}`;
    let pdfBuffer: Buffer | undefined;

    if (pdfFile) {
      const bytes = await pdfFile.arrayBuffer();
      pdfBuffer = Buffer.from(bytes);
    }

    const book = await Book.create({
      id: bookId,
      title: title.trim(),
      author,
      category,
      status,
      progress,
      rating,
      pdfData: pdfBuffer || undefined,
      hasPdf: !!pdfBuffer,
      userEmail,
    });

    logActivity(userEmail, `Added book "${title}"`);

    return { book: JSON.parse(JSON.stringify(book)) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add book' };
  }
}
