import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import UploadSession from '@/lib/models/UploadSession';
import UploadChunk from '@/lib/models/UploadChunk';
import { getBucket, deleteBucketFile, toBuffer } from '@/lib/files/gridfs';
import { MAX_INDEX_BYTES } from '@/lib/files/constants';
import { fileTypeOf } from '@/lib/files/mime';
import { uniqueTitle } from '@/lib/files/nodes';
import { indexContent } from '@/lib/files/indexer';
import { getDbUri, requireDbUserEmail } from '../../../../db/request';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const { uploadId } = await params;

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    const bucket = getBucket(conn);
    if (!bucket) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });

    const session = await UploadSession.findOne({ uploadId, userEmail }).lean();
    if (!session) return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });

    const chunks = await UploadChunk.find({ uploadId })
      .sort({ index: 1 })
      .select('index data')
      .lean();

    if (chunks.length !== session.chunkCount) {
      return NextResponse.json(
        { error: `Upload incomplete (${chunks.length}/${session.chunkCount})` },
        { status: 409 }
      );
    }

    const title = await uniqueTitle(userEmail, session.parentId ?? null, session.name);
    const upload = bucket.openUploadStream(title, { metadata: { contentType: session.mimeType } });
    const finished = new Promise<void>((resolve, reject) => {
      upload.once('error', reject);
      upload.once('finish', () => resolve());
    });

    const indexBuffers: Buffer[] = [];
    let indexBytes = 0;

    for (const chunk of chunks) {
      const buffer = toBuffer(chunk.data);
      if (!upload.write(buffer)) await once(upload, 'drain');
      if (indexBytes < MAX_INDEX_BYTES) {
        indexBuffers.push(buffer);
        indexBytes += buffer.length;
      }
    }

    upload.end();
    await finished;

    const gridFsId = upload.id;
    let doc;
    try {
      doc = await Doc.create({
        id: `f-${randomUUID()}`,
        title,
        kind: 'file',
        parentId: session.parentId ?? null,
        category: 'other',
        status: 'TO_READ',
        progress: 0,
        fileUrl: '',
        fileType: fileTypeOf(title),
        mimeType: session.mimeType,
        size: session.size,
        gridFsId,
        fileName: session.name,
        userEmail,
      });
    } catch (error) {
      await deleteBucketFile(bucket, gridFsId);
      throw error;
    }

    await UploadChunk.deleteMany({ uploadId });
    await UploadSession.deleteOne({ uploadId, userEmail });

    await indexContent({
      docId: doc.id,
      userEmail,
      title: doc.title,
      category: doc.category,
      fileType: doc.fileType,
      mimeType: doc.mimeType,
      buffer: Buffer.concat(indexBuffers),
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to finalize upload' },
      { status: 500 }
    );
  }
}
