import { ZipArchive } from 'archiver';
import type { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import { getBucket, toWebStream } from '@/lib/files/gridfs';
import { findOwnedDoc } from '@/lib/files/nodes';
import { getDbUri, requireDbUserEmail } from '../../db/request';

const MAX_ENTRIES = 2000;

type ZipEntry = {
  name: string;
  gridFsId: ObjectId | null | undefined;
  fileData?: Buffer;
};

function uniqueName(taken: Set<string>, name: string): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 2; i < 10000; i += 1) {
    const candidate = `${base} (${i})${ext}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
  return `${name}-${Date.now()}`;
}

export async function POST(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;
  const userEmail = auth.userEmail!;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    const bucket = getBucket(conn);
    if (!bucket) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });

    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === 'string').slice(0, 500)
      : [];
    if (ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 });

    const entries: ZipEntry[] = [];
    const taken = new Set<string>();

    for (const id of ids) {
      if (entries.length >= MAX_ENTRIES) break;
      const doc = await findOwnedDoc(userEmail, id);
      if (!doc || doc.deletedAt) continue;

      if (doc.kind === 'file') {
        entries.push({
          name: uniqueName(taken, doc.title),
          gridFsId: doc.gridFsId,
        });
        continue;
      }

      let level: { id: string; prefix: string }[] = [{ id: doc.id, prefix: doc.title }];
      for (let depth = 0; depth < 64 && level.length > 0 && entries.length < MAX_ENTRIES; depth += 1) {
        const childrenByParent = await Promise.all(
          level.map(async ({ id: parentId, prefix }) => ({
            prefix,
            children: await Doc.find({ userEmail, parentId, deletedAt: null })
              .select('id title kind gridFsId')
              .lean(),
          }))
        );

        const nextLevel: { id: string; prefix: string }[] = [];
        for (const group of childrenByParent) {
          for (const child of group.children) {
            const path = `${group.prefix}/${child.title}`;
            if (child.kind === 'folder') {
              nextLevel.push({ id: child.id, prefix: path });
            } else if (entries.length < MAX_ENTRIES) {
              entries.push({ name: uniqueName(taken, path), gridFsId: child.gridFsId });
            }
          }
        }
        level = nextLevel;
      }
    }

    if (entries.length === 0) {
      return NextResponse.json({ error: 'Nothing to download' }, { status: 404 });
    }

    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('error', () => {});

    for (const entry of entries) {
      if (entry.gridFsId) {
        archive.append(bucket.openDownloadStream(entry.gridFsId), { name: entry.name });
      } else if (entry.fileData) {
        archive.append(entry.fileData, { name: entry.name });
      }
    }

    void archive.finalize();

    return new Response(toWebStream(archive), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="samundar-files.zip"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build zip' },
      { status: 500 }
    );
  }
}
