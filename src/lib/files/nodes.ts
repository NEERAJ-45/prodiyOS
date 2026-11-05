import Doc from '@/lib/models/Doc';
import type { GridFSBucket } from 'mongodb';
import DocContent from '@/lib/models/DocContent';
import { copyName, numberedName, stripExtension } from './format';
import { deleteBucketFile } from './gridfs';

export const MAX_DEPTH = 32;

export function docIdQuery(id: string) {
  return /^[a-f\d]{24}$/i.test(id) ? { $or: [{ id }, { _id: id }] } : { id };
}

export function findOwnedDoc(userEmail: string, id: string) {
  return Doc.findOne({ $and: [{ userEmail }, docIdQuery(id)] }).lean();
}

export function findOwnedFile(userEmail: string, id: string) {
  return Doc.findOne({
    $and: [{ userEmail }, docIdQuery(id), { kind: 'file', deletedAt: null }],
  }).lean();
}

export function findOwnedFolder(userEmail: string, id: string) {
  return Doc.findOne({
    $and: [{ userEmail }, docIdQuery(id), { kind: 'folder', deletedAt: null }],
  }).lean();
}

export async function collectDescendantIds(
  userEmail: string,
  rootId: string,
  foldersOnly = false
): Promise<string[]> {
  const ids: string[] = [];
  let level = [rootId];

  for (let depth = 0; depth < MAX_DEPTH + 1 && level.length > 0; depth++) {
    const children = await Doc.find({ userEmail, parentId: { $in: level } })
      .select('id kind')
      .lean();
    level = [];
    for (const child of children) {
      if (!foldersOnly || child.kind === 'folder') ids.push(child.id);
      if (child.kind === 'folder') level.push(child.id);
    }
  }

  return ids;
}

export async function folderDepth(userEmail: string, parentId: string | null): Promise<number> {
  let depth = 0;
  let current = parentId;

  while (current && depth <= MAX_DEPTH) {
    const folder = await Doc.findOne({ userEmail, id: current, kind: 'folder' })
      .select('parentId')
      .lean();
    if (!folder) break;
    depth += 1;
    current = folder.parentId ?? null;
  }

  return depth;
}

export async function moveWouldCycle(
  userEmail: string,
  nodeId: string,
  targetParentId: string | null
): Promise<boolean> {
  if (!targetParentId) return false;
  if (targetParentId === nodeId) return true;
  const descendants = await collectDescendantIds(userEmail, nodeId, true);
  return descendants.includes(targetParentId);
}

export async function uniqueTitle(
  userEmail: string,
  parentId: string | null,
  desired: string
): Promise<string> {
  const base = stripExtension(desired).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rows = await Doc.find({
    userEmail,
    parentId,
    title: { $regex: `^${base}` },
  })
    .select('title')
    .limit(200)
    .lean();

  const taken = new Set(rows.map((row) => row.title));
  if (!taken.has(desired)) return desired;

  for (let i = 2; i < 1000; i += 1) {
    const candidate = numberedName(desired, i);
    if (!taken.has(candidate)) return candidate;
  }

  return numberedName(desired, Date.now());
}

export async function trashSubtree(
  userEmail: string,
  root: { id: string; parentId?: string | null }
): Promise<number> {
  const ids = [root.id, ...(await collectDescendantIds(userEmail, root.id))];
  await Doc.updateMany(
    { userEmail, id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
  await Doc.updateOne({ userEmail, id: root.id }, { $set: { trashedFrom: root.parentId ?? null } });
  return ids.length;
}

export async function restoreSubtree(
  userEmail: string,
  root: { id: string; parentId?: string | null }
): Promise<number> {
  let parentId = root.parentId ?? null;
  if (parentId) {
    const parent = await findOwnedFolder(userEmail, parentId);
    if (!parent) parentId = null;
  }

  const ids = [root.id, ...(await collectDescendantIds(userEmail, root.id))];
  await Doc.updateMany({ userEmail, id: { $in: ids } }, { $set: { deletedAt: null } });
  await Doc.updateOne({ userEmail, id: root.id }, { $set: { parentId } });
  return ids.length;
}

export async function purgeSubtrees(
  userEmail: string,
  roots: { id: string }[],
  bucket: GridFSBucket | null
): Promise<number> {
  if (roots.length === 0) return 0;

  const idSet = new Set<string>();
  for (const root of roots) {
    idSet.add(root.id);
    for (const id of await collectDescendantIds(userEmail, root.id)) idSet.add(id);
  }
  const ids = Array.from(idSet);

  if (bucket) {
    const files = await Doc.find({ userEmail, id: { $in: ids }, kind: 'file' })
      .select('gridFsId')
      .lean();
    await Promise.all(
      files.filter((f) => f.gridFsId).map((f) => deleteBucketFile(bucket, f.gridFsId!))
    );
  }

  await DocContent.deleteMany({ docId: { $in: ids } });
  await Doc.deleteMany({ userEmail, id: { $in: ids } });
  return ids.length;
}

export function duplicateTitle(title: string, isFolder: boolean): string {
  return isFolder ? `${title} (copy)` : copyName(title);
}
