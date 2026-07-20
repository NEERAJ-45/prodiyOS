import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookContent from '@/lib/models/BookContent';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const sourceType = searchParams.get('sourceType') || 'all';
    const customUri = request.headers.get('x-mongodb-url') || undefined;

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ results: [] });
    }

    const filter: Record<string, unknown> = {
      $text: { $search: q },
    };

    if (sourceType !== 'all') {
      filter.sourceType = sourceType;
    }

    const results = await BookContent.find(
      filter,
      {
        score: { $meta: 'textScore' },
        snippet: { $substr: ['$content', 0, 300] },
      }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('bookId sourceType title author category contentLength indexedAt')
      .lean();

    const sanitized = results.map((r) => {
      const { content, ...rest } = r as Record<string, unknown>;
      return rest;
    });

    return NextResponse.json({ results: sanitized, query: q });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
