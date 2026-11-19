import { NextResponse } from 'next/server';
import Doc from '@/lib/models/Doc';
import { connectToDatabase } from '@/lib/db';
import {
  MAX_DEPTH,
  findOwnedDoc,
  findOwnedFolder,
  folderDepth,
  moveWouldCycle,
  restoreSubtree,
  trashSubtree,
} from '@/lib/files/nodes';
import { getDbUri, requireDbUserEmail } from '../../request';

const MAX_BATCH = 500;

export async function POST(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = (await request.json()) as {
      action?: string;
      ids?: unknown;
      parentId?: string | null;
    };

    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(0, MAX_BATCH)
      : [];

    if (ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 });

    if (body.action === 'trash') {
      const owned = await Doc.find({ userEmail, id: { $in: ids }, deletedAt: null })
        .select('id parentId')
        .lean();
      let count = 0;
      for (const doc of owned) {
        count += await trashSubtree(userEmail, { id: doc.id, parentId: doc.parentId ?? null });
      }
      return NextResponse.json({ success: true, affected: count });
    }

    if (body.action === 'restore') {
      const owned = await Doc.find({ userEmail, id: { $in: ids }, deletedAt: { $ne: null } })
        .select('id parentId')
        .lean();
      let count = 0;
      for (const doc of owned) {
        count += await restoreSubtree(userEmail, { id: doc.id, parentId: doc.parentId ?? null });
      }
      return NextResponse.json({ success: true, affected: count });
    }

    if (body.action === 'move') {
      const targetParentId = body.parentId ?? null;
      if (targetParentId) {
        const parent = await findOwnedFolder(userEmail, targetParentId);
        if (!parent) return NextResponse.json({ error: 'Invalid destination' }, { status: 400 });
        const depth = (await folderDepth(userEmail, targetParentId)) + 1;
        if (depth > MAX_DEPTH) return NextResponse.json({ error: 'Folder depth exceeded' }, { status: 400 });
      }

      const owned = await Doc.find({ userEmail, id: { $in: ids }, deletedAt: null })
        .select('id kind')
        .lean();

      for (const doc of owned) {
        if (doc.kind !== 'folder') continue;
        if (targetParentId === doc.id || (await moveWouldCycle(userEmail, doc.id, targetParentId))) {
          return NextResponse.json({ error: 'Cannot move a folder into itself' }, { status: 400 });
        }
      }

      const moved = await Doc.updateMany(
        { userEmail, id: { $in: owned.map((doc) => doc.id) }, deletedAt: null },
        { $set: { parentId: targetParentId } }
      );
      return NextResponse.json({ success: true, affected: moved.modifiedCount });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk operation failed' },
      { status: 500 }
    );
  }
}
