import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UploadSession from '@/lib/models/UploadSession';
import { CHUNK_SIZE, MAX_DEPTH, MAX_UPLOAD_BYTES } from '@/lib/files/constants';
import { sanitizeName } from '@/lib/files/format';
import { findOwnedFolder, folderDepth } from '@/lib/files/nodes';
import { getDbUri, requireDbUserEmail } from '../../../db/request';

export async function POST(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = (await request.json()) as {
      name?: string;
      parentId?: string | null;
      mimeType?: string;
      size?: number;
    };

    const name = sanitizeName(String(body.name || ''));
    if (!name) return NextResponse.json({ error: 'Valid name required' }, { status: 400 });

    const size = Number(body.size);
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: 'Valid size required' }, { status: 400 });
    }
    if (size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File exceeds 100 MB limit' }, { status: 413 });
    }

    const parentId = body.parentId && body.parentId !== 'root' ? body.parentId : null;
    if (parentId) {
      const parent = await findOwnedFolder(userEmail, parentId);
      if (!parent) return NextResponse.json({ error: 'Invalid destination' }, { status: 400 });
      const depth = (await folderDepth(userEmail, parentId)) + 1;
      if (depth > MAX_DEPTH) {
        return NextResponse.json({ error: 'Folder depth exceeded' }, { status: 400 });
      }
    }

    const uploadId = randomUUID();
    const chunkCount = Math.max(1, Math.ceil(size / CHUNK_SIZE));

    await UploadSession.create({
      uploadId,
      userEmail,
      parentId,
      name,
      mimeType: String(body.mimeType || 'application/octet-stream'),
      size,
      chunkCount,
    });

    return NextResponse.json({ uploadId, chunkSize: CHUNK_SIZE, chunkCount }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start upload' },
      { status: 500 }
    );
  }
}
