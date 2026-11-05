import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getBucket } from '@/lib/files/gridfs';
import { duplicateNode } from '@/lib/files/duplicate';
import {
  MAX_DEPTH,
  findOwnedDoc,
  findOwnedFolder,
  folderDepth,
} from '@/lib/files/nodes';
import { getDbUri, requireDbUserEmail } from '../../request';

export async function POST(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = (await request.json()) as { id?: string; parentId?: string | null };
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const source = await findOwnedDoc(userEmail, body.id);
    if (!source || source.deletedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const targetParentId =
      body.parentId === undefined ? (source.parentId ?? null) : body.parentId || null;

    if (targetParentId) {
      const parent = await findOwnedFolder(userEmail, targetParentId);
      if (!parent) return NextResponse.json({ error: 'Invalid destination' }, { status: 400 });
      const depth = (await folderDepth(userEmail, targetParentId)) + 1;
      if (depth > MAX_DEPTH) {
        return NextResponse.json({ error: 'Folder depth exceeded' }, { status: 400 });
      }
    }

    const doc = await duplicateNode({
      userEmail,
      source,
      targetParentId,
      bucket: getBucket(conn),
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate' },
      { status: 500 }
    );
  }
}
