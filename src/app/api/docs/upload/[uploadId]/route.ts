import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UploadSession from '@/lib/models/UploadSession';
import UploadChunk from '@/lib/models/UploadChunk';
import { getDbUri, requireDbUserEmail } from '../../../db/request';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const auth = await requireDbUserEmail();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { uploadId } = await params;
    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) return NextResponse.json({ success: true });

    await UploadChunk.deleteMany({ uploadId });
    await UploadSession.deleteOne({ uploadId, userEmail: auth.userEmail });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
