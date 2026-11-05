import { randomUUID } from 'node:crypto';
import type { GridFSBucket, ObjectId } from 'mongodb';
import Doc, { type IDoc } from '@/lib/models/Doc';
import { copyBucketFile, readBucketFile } from './gridfs';
import { copyName } from './format';
import { isTextMime } from './mime';
import { uniqueTitle } from './nodes';
import { indexContent } from './indexer';

type SourceDoc = IDoc & { _id?: unknown };

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function indexCopy(
  bucket: GridFSBucket | null,
  gridFsId: ObjectId | null | undefined,
  doc: { id: string; userEmail: string; title: string; category: string; fileType: string; mimeType: string }
) {
  if (!bucket || !gridFsId) return;
  if (!isTextMime(doc.mimeType, doc.title) && doc.fileType !== 'pdf' && doc.fileType !== 'docx') return;

  try {
    const buffer = await readBucketFile(bucket, gridFsId, 5 * 1024 * 1024);
    await indexContent({
      docId: doc.id,
      userEmail: doc.userEmail,
      title: doc.title,
      category: doc.category,
      fileType: doc.fileType,
      mimeType: doc.mimeType,
      buffer,
    });
  } catch {
    // indexing is best-effort
  }
}

export async function duplicateFile(
  userEmail: string,
  source: SourceDoc,
  targetParentId: string | null,
  bucket: GridFSBucket | null
) {
  const title = await uniqueTitle(userEmail, targetParentId, copyName(source.title));
  const gridFsId = source.gridFsId && bucket
    ? await copyBucketFile(bucket, source.gridFsId, title, source.mimeType)
    : null;

  const doc = await Doc.create({
    id: `f-${randomUUID()}`,
    title,
    kind: 'file',
    parentId: targetParentId,
    category: source.category,
    status: source.status,
    progress: source.progress,
    fileUrl: gridFsId ? '' : source.fileUrl,
    fileType: source.fileType,
    mimeType: source.mimeType,
    size: source.size,
    gridFsId,
    fileName: source.fileName || source.title,
    userEmail,
  });

  await indexCopy(bucket, gridFsId, {
    id: doc.id,
    userEmail,
    title: doc.title,
    category: doc.category,
    fileType: doc.fileType,
    mimeType: doc.mimeType,
  });

  return doc;
}

export async function duplicateFolder(
  userEmail: string,
  source: SourceDoc,
  targetParentId: string | null,
  bucket: GridFSBucket | null
) {
  const title = await uniqueTitle(userEmail, targetParentId, `${source.title} (copy)`);
  const root = await Doc.create({
    id: `d-${randomUUID()}`,
    title,
    kind: 'folder',
    parentId: targetParentId,
    category: source.category,
    status: source.status,
    progress: 0,
    fileUrl: '',
    fileType: '',
    mimeType: 'inode/directory',
    size: 0,
    fileName: '',
    userEmail,
  });

  let level: { srcId: string; dstId: string }[] = [{ srcId: source.id, dstId: root.id }];

  for (let depth = 0; depth < 64 && level.length > 0; depth += 1) {
    const childrenByParent = await Promise.all(
      level.map(async ({ srcId, dstId }) => ({
        dstId,
        children: await Doc.find({ userEmail, parentId: srcId, deletedAt: null })
          .select('-fileUrl')
          .lean(),
      }))
    );

    const inserts: Record<string, unknown>[] = [];
    const nextLevel: { srcId: string; dstId: string }[] = [];

    for (const { dstId, children } of childrenByParent) {
      const files = children.filter((child) => child.kind === 'file');
      const copied = await mapLimit(files, 8, async (child) => {
        const newId = `f-${randomUUID()}`;
        const gridFsId =
          child.gridFsId && bucket
            ? await copyBucketFile(bucket, child.gridFsId, child.title, child.mimeType)
            : null;
        return {
          id: newId,
          title: child.title,
          kind: 'file',
          parentId: dstId,
          category: child.category,
          status: child.status,
          progress: child.progress,
          fileUrl: gridFsId ? '' : child.fileUrl,
          fileType: child.fileType,
          mimeType: child.mimeType,
          size: child.size,
          gridFsId,
          fileName: child.fileName || child.title,
          userEmail,
        };
      });

      inserts.push(...copied);

      for (const child of children) {
        if (child.kind !== 'folder') continue;
        const newId = `d-${randomUUID()}`;
        inserts.push({
          id: newId,
          title: child.title,
          kind: 'folder',
          parentId: dstId,
          category: child.category,
          status: child.status,
          progress: 0,
          fileUrl: '',
          fileType: '',
          mimeType: 'inode/directory',
          size: 0,
          fileName: '',
          userEmail,
        });
        nextLevel.push({ srcId: child.id, dstId: newId });
      }
    }

    if (inserts.length > 0) await Doc.insertMany(inserts, { ordered: false });
    level = nextLevel;
  }

  return root;
}

export async function duplicateNode(params: {
  userEmail: string;
  source: SourceDoc;
  targetParentId: string | null;
  bucket: GridFSBucket | null;
}) {
  const { userEmail, source, targetParentId, bucket } = params;
  return source.kind === 'folder'
    ? duplicateFolder(userEmail, source, targetParentId, bucket)
    : duplicateFile(userEmail, source, targetParentId, bucket);
}
