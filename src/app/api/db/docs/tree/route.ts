import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import { getDbUri, requireDbUserEmail } from '../../request';

const PAGE_CAP = 500;

export async function GET(request: Request) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ folders: [] });

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('parentId');
    const parentId = !raw || raw === 'root' ? null : raw;

    const folders = await Doc.find({
      userEmail: auth.userEmail,
      parentId,
      kind: 'folder',
      deletedAt: null,
    })
      .sort({ title: 1 })
      .limit(PAGE_CAP)
      .select('id title parentId kind updatedAt')
      .lean();

    return NextResponse.json({ folders });
  } catch {
    return NextResponse.json({ folders: [] });
  }
}
