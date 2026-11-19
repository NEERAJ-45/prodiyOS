import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import DocContent from '@/lib/models/DocContent';
import { getBucket, deleteBucketFile } from '@/lib/files/gridfs';
import { findOwnedDoc, restoreSubtree } from '@/lib/files/nodes';
import { getDbUri, requireDbUserEmail } from '../../request';

export async function POST(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const { id } = (await request.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const doc = await findOwnedDoc(auth.userEmail!, id);
    if (!doc || !doc.deletedAt) {
      return NextResponse.json({ error: 'Not found in trash' }, { status: 404 });
    }

    const restored = await restoreSubtree(auth.userEmail!, {
      id: doc.id,
      parentId: doc.parentId ?? null,
    });
    return NextResponse.json({ success: true, restored });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    const bucket = getBucket(conn);

    const { searchParams } = new URL(request.url);
    const userEmail = auth.userEmail!;

    if (searchParams.get('all') === '1') {
      const trashed = await Doc.find({ userEmail, deletedAt: { $ne: null } })
        .select('id gridFsId kind')
        .lean();
      const ids = trashed.map((doc) => doc.id);

      await Promise.all(
        trashed
          .filter((doc) => doc.gridFsId)
          .map((doc) => (bucket ? deleteBucketFile(bucket, doc.gridFsId!) : Promise.resolve()))
      );
      await DocContent.deleteMany({ docId: { $in: ids } });
      await Doc.deleteMany({ userEmail, id: { $in: ids } });
      return NextResponse.json({ success: true, purged: ids.length });
    }

    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const doc = await findOwnedDoc(userEmail, id);
    if (!doc || !doc.deletedAt) {
      return NextResponse.json({ error: 'Not found in trash' }, { status: 404 });
    }

    const { purgeSubtrees } = await import('@/lib/files/nodes');
    const purged = await purgeSubtrees(userEmail, [{ id: doc.id }], bucket);
    return NextResponse.json({ success: true, purged });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to purge' },
      { status: 500 }
    );
  }
}
