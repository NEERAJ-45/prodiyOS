import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import {
  deleteBucketFile,
  getBucket,
  readBucketFile,
  toBuffer,
  uploadBuffer,
} from '@/lib/files/gridfs';
import { convertDocxToHtml, fetchDocFile } from '@/lib/doc-extractor';
import { MAX_TEXT_BYTES } from '@/lib/files/constants';
import { isTextMime, mimeForName } from '@/lib/files/mime';
import { docIdQuery } from '@/lib/files/nodes';
import { indexContent } from '@/lib/files/indexer';

const MAX_READ_BYTES = 20 * 1024 * 1024;

async function findDoc(userEmail: string, id: string) {
  return Doc.findOne({ $and: [{ userEmail }, docIdQuery(id), { deletedAt: null }] })
    .select('+fileData fileUrl fileType title category mimeType size gridFsId kind')
    .lean();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const conn = await connectToDatabase(request.headers.get('x-mongodb-url') || undefined);
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const doc = await findDoc(userEmail, id);
    if (!doc || doc.kind !== 'file') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let buffer: Buffer | null = null;
    if (doc.gridFsId) {
      const bucket = getBucket(conn);
      if (bucket) buffer = await readBucketFile(bucket, doc.gridFsId, MAX_READ_BYTES);
    } else if (doc.fileData) {
      buffer = toBuffer(doc.fileData);
    } else if (doc.fileUrl) {
      buffer = await fetchDocFile(doc.fileUrl);
    }

    if (!buffer) {
      return NextResponse.json({ error: 'File content not found' }, { status: 404 });
    }

    if (doc.fileType === 'docx') {
      const html = await convertDocxToHtml(buffer);
      return NextResponse.json({ type: 'docx', html });
    }

    return NextResponse.json({ type: 'text', text: buffer.toString('utf-8') });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const conn = await connectToDatabase(request.headers.get('x-mongodb-url') || undefined);
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const doc = await findDoc(userEmail, id);
    if (!doc || doc.kind !== 'file') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!isTextMime(doc.mimeType, doc.title)) {
      return NextResponse.json({ error: 'Only text files can be edited' }, { status: 400 });
    }

    const body = (await request.json()) as { content?: string };
    if (typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const buffer = Buffer.from(body.content, 'utf8');
    if (buffer.length > MAX_TEXT_BYTES) {
      return NextResponse.json({ error: 'Text file exceeds 5 MB' }, { status: 413 });
    }

    const bucket = getBucket(conn);
    if (!bucket) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });

    const mimeType = doc.mimeType || mimeForName(doc.title);
    const gridFsId = await uploadBuffer(bucket, doc.title, buffer, mimeType);

    await Doc.updateOne(
      { $and: [{ userEmail }, { id: doc.id }] },
      { $set: { gridFsId, size: buffer.length, mimeType, fileUrl: '' } }
    );

    if (doc.gridFsId) await deleteBucketFile(bucket, doc.gridFsId);

    await indexContent({
      docId: doc.id,
      userEmail,
      title: doc.title,
      category: doc.category,
      fileType: doc.fileType,
      mimeType,
      buffer,
    });

    return NextResponse.json({ success: true, size: buffer.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save content' },
      { status: 500 }
    );
  }
}
