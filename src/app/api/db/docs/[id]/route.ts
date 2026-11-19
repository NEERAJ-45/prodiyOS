import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import { findOwnedDoc } from '@/lib/files/nodes';
import { getDbUri, requireDbUserEmail } from '../../request';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  const { id } = await params;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const doc = await findOwnedDoc(userEmail, id);
    if (!doc || doc.deletedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const path: { id: string; title: string }[] = [];
    let parentId = doc.parentId;
    for (let depth = 0; depth < 32 && parentId; depth += 1) {
      const parent = await Doc.findOne({ userEmail, id: parentId, kind: 'folder' })
        .select('id title parentId')
        .lean();
      if (!parent) break;
      path.unshift({ id: parent.id, title: parent.title });
      parentId = parent.parentId;
    }

    return NextResponse.json({ doc, path });
  } catch (error) {
    console.error('GET /api/db/docs/[id] failed', error);
    return NextResponse.json({ error: 'Failed to load item' }, { status: 500 });
  }
}
