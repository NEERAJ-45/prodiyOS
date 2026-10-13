import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import DocContent from '@/lib/models/DocContent';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const customUri = request.headers.get('x-mongodb-url') || undefined;

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ results: [] });
    }

    const results = await DocContent.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('docId title category contentLength indexedAt')
      .lean();

    return NextResponse.json({ results, query: q });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
