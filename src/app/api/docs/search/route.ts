import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import DocContent from '@/lib/models/DocContent';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ results: [] });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const customUri = request.headers.get('x-mongodb-url') || undefined;

    if (!q) return NextResponse.json({ results: [] });

    const conn = await connectToDatabase(customUri);
    if (!conn) return NextResponse.json({ results: [] });

    const hits = await DocContent.find(
      { userEmail, $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('docId title category contentLength indexedAt')
      .lean();

    const alive = await Doc.find({
      userEmail,
      id: { $in: hits.map((hit) => hit.docId) },
      deletedAt: null,
    })
      .select('id')
      .lean();

    const aliveIds = new Set(alive.map((doc) => doc.id));
    const results = hits.filter((hit) => aliveIds.has(hit.docId));

    return NextResponse.json({ results, query: q });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
