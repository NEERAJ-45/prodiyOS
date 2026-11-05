import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import type { GridFSBucket, ObjectId } from 'mongodb';

const buckets = new WeakMap<object, GridFSBucket>();

export function getBucket(conn: mongoose.Connection): GridFSBucket | null {
  const db = conn.db;
  if (!db) return null;
  let bucket = buckets.get(db);
  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'docFiles' });
    buckets.set(db, bucket);
  }
  return bucket;
}

export function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;

  const data = value as { buffer?: unknown; position?: number } | null;
  const view = data?.buffer;
  if (ArrayBuffer.isView(view)) {
    const bytes = view as Uint8Array;
    const length = typeof data?.position === 'number' ? data.position : bytes.byteLength;
    return Buffer.from(bytes.buffer, bytes.byteOffset, length);
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  return Buffer.alloc(0);
}

export function uploadBuffer(
  bucket: GridFSBucket,
  filename: string,
  data: Buffer,
  contentType: string
): Promise<ObjectId> {
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, { metadata: { contentType } });
    stream.once('error', reject);
    stream.once('finish', () => resolve(stream.id as ObjectId));
    stream.end(data);
  });
}

export function copyBucketFile(
  bucket: GridFSBucket,
  sourceId: ObjectId,
  filename: string,
  contentType: string
): Promise<ObjectId> {
  return new Promise((resolve, reject) => {
    const source = bucket.openDownloadStream(sourceId);
    const target = bucket.openUploadStream(filename, { metadata: { contentType } });
    source.once('error', (err) => {
      target.destroy();
      reject(err);
    });
    target.once('error', reject);
    target.once('finish', () => resolve(target.id as ObjectId));
    source.pipe(target);
  });
}

export function readBucketFile(
  bucket: GridFSBucket,
  id: ObjectId,
  maxBytes = Number.POSITIVE_INFINITY
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const stream = bucket.openDownloadStream(id);
    stream.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        stream.destroy(new Error('File exceeds read limit'));
        return;
      }
      chunks.push(chunk);
    });
    stream.once('error', reject);
    stream.once('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function bucketFileSize(bucket: GridFSBucket, id: ObjectId): Promise<number> {
  const file = await bucket.find({ _id: id }).limit(1).next();
  return file?.length ?? 0;
}

export async function deleteBucketFile(bucket: GridFSBucket, id: ObjectId): Promise<void> {
  try {
    await bucket.delete(id);
  } catch {
    // already gone
  }
}

export function streamBucketFile(
  bucket: GridFSBucket,
  id: ObjectId,
  range?: { start: number; end: number } | null
): Readable {
  return range
    ? bucket.openDownloadStream(id, { start: range.start, end: range.end + 1 })
    : bucket.openDownloadStream(id);
}

export type ByteRange = { start: number; end: number };

export function parseRange(header: string | null, size: number): ByteRange | null | 'invalid' {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim().replace(/\s+/g, ''));
  if (!match) return 'invalid';

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return 'invalid';
  if (size <= 0) return 'invalid';

  let start: number;
  let end: number;

  if (!rawStart) {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 'invalid';
    if (start >= size) return 'invalid';
    end = Math.min(end, size - 1);
  }

  if (start > end) return 'invalid';
  return { start, end };
}

export function toWebStream(stream: Readable): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}
