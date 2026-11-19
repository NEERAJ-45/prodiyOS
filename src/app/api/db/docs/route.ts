import { randomUUID } from 'node:crypto';
import mongoose, { type QueryFilter } from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc, { type IDoc } from '@/lib/models/Doc';
import { getBucket, uploadBuffer } from '@/lib/files/gridfs';
import { fileTypeOf, mimeForName } from '@/lib/files/mime';
import { sanitizeName } from '@/lib/files/format';
import { indexContent } from '@/lib/files/indexer';
import {
  MAX_DEPTH,
  docIdQuery,
  findOwnedDoc,
  findOwnedFolder,
  folderDepth,
  moveWouldCycle,
  trashSubtree,
  uniqueTitle,
} from '@/lib/files/nodes';
import { decodeCursor, encodeCursor } from '@/lib/files/cursor';
import { getDbUri, requireDbUserEmail } from '../request';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const FOLDER_PAGE_CAP = 500;

const SORT_FIELDS = {
  name: 'title',
  size: 'size',
  type: 'fileType',
  modified: 'updatedAt',
} as const;

type SortKey = keyof typeof SORT_FIELDS;

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function normalizeParent(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'root' ? trimmed : null;
}

async function validateParent(userEmail: string, parentId: string | null) {
  if (!parentId) return { depth: 1 };
  const folder = await findOwnedFolder(userEmail, parentId);
  if (!folder) return null;
  const depth = (await folderDepth(userEmail, parentId)) + 1;
  return depth <= MAX_DEPTH ? { depth } : null;
}

export async function GET(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ folders: [], files: [], hasMore: false });

    const { searchParams } = new URL(request.url);
    const parentId = normalizeParent(searchParams.get('parentId'));
    const trashed = searchParams.get('trashed') === '1';
    const q = searchParams.get('q')?.trim() || '';
    const sortKey = (searchParams.get('sort') || 'name') as SortKey;
    const sortField = SORT_FIELDS[sortKey] ?? 'title';
    const direction = searchParams.get('dir') === 'desc' ? -1 : 1;
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 200);
    const cursor = searchParams.get('cursor');

    if (trashed) {
      const filter: QueryFilter<IDoc> = { userEmail, deletedAt: { $ne: null } };
      if (q) filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      const decoded = cursor ? decodeCursor(cursor) : null;
      if (decoded) {
        const marker = new mongoose.Types.ObjectId(decoded.id);
        filter.$or = [
          { deletedAt: { $lt: new Date(String(decoded.value)) } },
          { deletedAt: new Date(String(decoded.value)), _id: { $lt: marker } },
        ];
      }

      const rows = await Doc.find(filter)
        .sort({ deletedAt: -1, _id: -1 })
        .limit(limit + 1)
        .select('-fileUrl')
        .lean();

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];

      return NextResponse.json({
        folders: [],
        files: page,
        hasMore,
        nextCursor:
          hasMore && last
            ? encodeCursor(new Date(last.deletedAt as unknown as Date).toISOString(), String(last._id))
            : null,
      });
    }

    if (searchParams.get('scope') === 'all') {
      if (!q) return NextResponse.json({ folders: [], files: [], hasMore: false, nextCursor: null });
      const rows = await Doc.find({
        userEmail,
        deletedAt: null,
        title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      })
        .sort({ title: 1 })
        .limit(30)
        .select('-fileUrl')
        .lean();
      return NextResponse.json({
        folders: rows.filter((row) => row.kind === 'folder'),
        files: rows.filter((row) => row.kind !== 'folder'),
        hasMore: false,
        nextCursor: null,
      });
    }

    const folderFilter: QueryFilter<IDoc> = {
      userEmail,
      parentId,
      kind: 'folder',
      deletedAt: null,
    };
    if (q) folderFilter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const folders = await Doc.find(folderFilter)
      .sort({ title: 1 })
      .limit(FOLDER_PAGE_CAP)
      .select('-fileUrl')
      .lean();

    const fileFilter: QueryFilter<IDoc> = {
      userEmail,
      parentId,
      kind: 'file',
      deletedAt: null,
    };
    if (q) fileFilter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const decoded = cursor ? decodeCursor(cursor) : null;
    if (decoded) {
      const marker = new mongoose.Types.ObjectId(decoded.id);
      const value = sortField === 'size' ? Number(decoded.value) : decoded.value;
      const op = direction === 1 ? '$gt' : '$lt';
      fileFilter.$or = [
        { [sortField]: { [op]: value } },
        { [sortField]: value, _id: { [op]: marker } },
      ];
    }

    const rows = await Doc.find(fileFilter)
      .sort({ [sortField]: direction, _id: direction })
      .limit(limit + 1)
      .select('-fileUrl')
      .lean();

    const hasMore = rows.length > limit;
    const files = hasMore ? rows.slice(0, limit) : rows;
    const last = files[files.length - 1];

    return NextResponse.json({
      folders,
      files,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCursor(
              sortField === 'updatedAt'
                ? new Date(last.updatedAt as unknown as Date).toISOString()
                : (last as Record<string, unknown>)[sortField],
              String(last._id)
            )
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return bad('Database unavailable', 503);
    const bucket = getBucket(conn);

    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;
    let uploaded: { name: string; buffer: Buffer } | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      body = {
        title: formData.get('title'),
        parentId: formData.get('parentId'),
        category: formData.get('category'),
        status: formData.get('status'),
        progress: formData.get('progress'),
        kind: 'file',
      };
      if (file && file.size > 0) {
        if (file.size > MAX_UPLOAD_BYTES) return bad('File exceeds 100 MB limit', 413);
        uploaded = { name: file.name, buffer: Buffer.from(await file.arrayBuffer()) };
      }
    } else {
      body = await request.json();
    }

    const parentId = normalizeParent(body.parentId);
    const validated = await validateParent(userEmail, parentId);
    if (!validated) return bad('Invalid parent folder or folder depth exceeded');

    const kind = body.kind === 'folder' ? 'folder' : 'file';
    const rawTitle = String(body.title || uploaded?.name || '').trim();
    const title = sanitizeName(rawTitle);
    if (!title) return bad('Valid name required');

    const finalTitle = await uniqueTitle(userEmail, parentId, title);
    const base = {
      id: `${kind === 'folder' ? 'd' : 'f'}-${randomUUID()}`,
      title: finalTitle,
      kind,
      parentId,
      category: String(body.category || 'other'),
      status: (body.status as IDoc['status']) || 'TO_READ',
      progress: Number(body.progress) || 0,
      userEmail,
    };

    if (kind === 'folder') {
      const doc = await Doc.create({ ...base, fileType: '', mimeType: 'inode/directory', size: 0 });
      return NextResponse.json({ doc }, { status: 201 });
    }

    const content = typeof body.content === 'string' ? body.content : null;
    if (!uploaded && content !== null) {
      const buffer = Buffer.from(content, 'utf8');
      if (buffer.length > MAX_TEXT_BYTES) return bad('Text file exceeds 5 MB', 413);
      if (!bucket) return bad('Storage unavailable', 503);

      const mimeType =
        typeof body.mimeType === 'string' && body.mimeType
          ? body.mimeType
          : fileTypeOf(finalTitle) === 'file'
            ? 'text/plain'
            : mimeForName(finalTitle);
      const gridFsId = await uploadBuffer(bucket, finalTitle, buffer, mimeType);

      const doc = await Doc.create({
        ...base,
        fileUrl: '',
        fileType: fileTypeOf(finalTitle),
        mimeType,
        size: buffer.length,
        gridFsId,
        fileName: finalTitle,
      });

      await indexContent({
        docId: doc.id,
        userEmail,
        title: doc.title,
        category: doc.category,
        fileType: doc.fileType,
        mimeType,
        buffer,
      });

      return NextResponse.json({ doc }, { status: 201 });
    }

    if (uploaded) {
      if (!bucket) return bad('Storage unavailable', 503);
      const displayName = sanitizeName(uploaded.name) || 'upload';
      const mimeType = mimeForName(displayName);
      const gridFsId = await uploadBuffer(bucket, displayName, uploaded.buffer, mimeType);

      const doc = await Doc.create({
        ...base,
        title: await uniqueTitle(userEmail, parentId, displayName),
        fileUrl: '',
        fileType: fileTypeOf(displayName),
        mimeType,
        size: uploaded.buffer.length,
        gridFsId,
        fileName: displayName,
      });

      await indexContent({
        docId: doc.id,
        userEmail,
        title: doc.title,
        category: doc.category,
        fileType: doc.fileType,
        mimeType,
        buffer: uploaded.buffer,
      });

      return NextResponse.json({ doc }, { status: 201 });
    }

    const fileUrl = String(body.fileUrl || '');
    if (!fileUrl) return bad('file or content required');

    const doc = await Doc.create({
      ...base,
      fileUrl,
      fileType: String(body.fileType || fileTypeOf(fileUrl)),
      mimeType: String(body.mimeType || mimeForName(fileUrl)),
      size: Number(body.size) || 0,
      fileName: String(body.fileName || title),
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return bad('id required');

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return bad('Database unavailable', 503);

    const existing = await findOwnedDoc(userEmail, id);
    if (!existing) return bad('Not found', 404);

    const body = (await request.json()) as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    if (body.status) update.status = body.status;
    if (body.progress !== undefined) update.progress = Math.max(0, Math.min(100, Number(body.progress) || 0));
    if (body.category !== undefined) update.category = String(body.category);

    if (body.title !== undefined) {
      const title = sanitizeName(String(body.title));
      if (!title) return bad('Valid name required');
      update.title = await uniqueTitle(userEmail, existing.parentId ?? null, title);
    }

    if (body.parentId !== undefined) {
      const parentId = normalizeParent(body.parentId);
      if (parentId) {
        const parent = await findOwnedFolder(userEmail, parentId);
        if (!parent) return bad('Invalid destination folder');
        if (await moveWouldCycle(userEmail, existing.id, parentId)) {
          return bad('Cannot move a folder into itself');
        }
        const depth = (await folderDepth(userEmail, parentId)) + 1;
        if (depth > MAX_DEPTH) return bad('Folder depth exceeded');
      }
      update.parentId = parentId;
    }

    const doc = await Doc.findOneAndUpdate(
      { $and: [{ userEmail }, docIdQuery(id)] },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ doc });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return bad('id required');

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return bad('Database unavailable', 503);

    const existing = await findOwnedDoc(userEmail, id);
    if (!existing) return bad('Not found', 404);

    const { purgeSubtrees } = await import('@/lib/files/nodes');
    if (searchParams.get('purge') === '1') {
      const count = await purgeSubtrees(userEmail, [{ id: existing.id }], getBucket(conn));
      return NextResponse.json({ success: true, purged: count });
    }

    const count = await trashSubtree(userEmail, {
      id: existing.id,
      parentId: existing.parentId ?? null,
    });
    return NextResponse.json({ success: true, trashed: count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500 }
    );
  }
}
