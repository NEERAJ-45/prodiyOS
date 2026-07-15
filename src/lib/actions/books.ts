'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectToDatabase } from '@/lib/db';
import Book from '@/lib/models/Book';
import { logActivity } from '@/lib/activity-logger';

export async function createBook(formData: FormData) {
  try {
    const userEmail = formData.get('userEmail') as string;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string || '';
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
    let pdfPath: string | undefined;

    if (pdfFile) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'books');
      await mkdir(uploadDir, { recursive: true });
      const filename = `${bookId}.pdf`;
      const filePath = path.join(uploadDir, filename);
      const bytes = await pdfFile.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      pdfPath = `uploads/books/${filename}`;
    }

    const book = await Book.create({
      id: bookId,
      title: title.trim(),
      author,
      status,
      progress,
      rating,
      pdfPath,
      userEmail,
    });

    logActivity(userEmail, `Added book "${title}"`);

    return { book: JSON.parse(JSON.stringify(book)) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add book' };
  }
}
