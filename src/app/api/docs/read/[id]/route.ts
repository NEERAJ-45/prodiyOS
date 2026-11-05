import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import {
  bucketFileSize,
  getBucket,
  parseRange,
  streamBucketFile,
  toWebStream,
} from '@/lib/files/gridfs';
import { docIdQuery } from '@/lib/files/nodes';

const LEGACY_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  md: 'text/markdown; charset=utf-8',
};

function contentDisposition(name: string, download: boolean) {
  const safe = name.replace(/["\\\r\n]/g, '_');
  return `${download ? 'attachment' : 'inline'}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return Response.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const doc = await Doc.findOne({
      $and: [{ userEmail }, docIdQuery(id), { deletedAt: null }],
    })
      .select('+fileData title fileUrl fileType fileName mimeType size gridFsId')
      .lean();

    if (!doc) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get('download') === '1';
    const name = doc.fileName || doc.title || 'file';

    if (doc.gridFsId) {
      const bucket = getBucket(conn);
      if (!bucket) return Response.json({ error: 'Storage unavailable' }, { status: 503 });

      const size = doc.size || (await bucketFileSize(bucket, doc.gridFsId));
      const etag = `"${String(doc.gridFsId)}"`;

      if (request.headers.get('if-none-match') === etag) {
        return new Response(null, { status: 304, headers: { ETag: etag } });
      }

      const rangeHeader = request.headers.get('range');
      const range = parseRange(rangeHeader, size);

      if (range === 'invalid') {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Length': String(range ? range.end - range.start + 1 : size),
        'Accept-Ranges': 'bytes',
        ETag: etag,
        'Cache-Control': 'private, max-age=31536000, immutable',
        'Content-Disposition': contentDisposition(name, download),
        'X-Content-Type-Options': 'nosniff',
      };

      if (range) {
        headers['Content-Range'] = `bytes ${range.start}-${range.end}/${size}`;
      }

      const stream = streamBucketFile(bucket, doc.gridFsId, range);
      return new Response(toWebStream(stream), { status: range ? 206 : 200, headers });
    }

    if (doc.fileData) {
      const buffer = Buffer.from(doc.fileData.buffer, doc.fileData.byteOffset, doc.fileData.byteLength);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': LEGACY_MIME[doc.fileType] || 'application/octet-stream',
          'Content-Length': String(buffer.length),
          'Content-Disposition': contentDisposition(name, download),
        },
      });
    }

    if (!doc.fileUrl) {
      return Response.json({ error: 'File content not found' }, { status: 404 });
    }

    return Response.redirect(doc.fileUrl, 302);
  } catch {
    return Response.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
