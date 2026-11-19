import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UploadSession from '@/lib/models/UploadSession';
import UploadChunk from '@/lib/models/UploadChunk';
import { CHUNK_SIZE } from '@/lib/files/constants';
import { getDbUri, requireDbUserEmail } from '../../../../db/request';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { uploadId } = await params;
    const { searchParams } = new URL(request.url);
    const index = Number(searchParams.get('index'));

    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: 'Valid chunk index required' }, { status: 400 });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const session = await UploadSession.findOne({
      uploadId,
      userEmail: auth.userEmail,
    }).lean();
    if (!session) return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
    if (index >= session.chunkCount) {
      return NextResponse.json({ error: 'Chunk index out of range' }, { status: 400 });
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0 || buffer.length > CHUNK_SIZE) {
      return NextResponse.json({ error: 'Invalid chunk size' }, { status: 413 });
    }

    await UploadChunk.updateOne(
      { uploadId, index },
      { $set: { data: buffer, createdAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, index });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to store chunk' },
      { status: 500 }
    );
  }
}
