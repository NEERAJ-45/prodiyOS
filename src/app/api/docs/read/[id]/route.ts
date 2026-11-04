import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const query = /^[a-f\d]{24}$/i.test(id) ? { $or: [{ id }, { _id: id }] } : { id };
    const doc = await Doc.findOne(query).select('+fileData title fileUrl fileType fileName').lean();
    if (!doc) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    if (doc.fileData) {
      const mime: Record<string, string> = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        md: 'text/markdown; charset=utf-8',
      };
      return new NextResponse(new Uint8Array(doc.fileData.buffer) as BodyInit, {
        headers: {
          'Content-Type': mime[doc.fileType],
          'Content-Disposition': `inline; filename="${doc.fileName || doc.title}"`,
        },
      });
    }

    if (!doc.fileUrl) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    return NextResponse.redirect(doc.fileUrl);
  } catch {
    return NextResponse.json({ error: 'Failed to load doc' }, { status: 500 });
  }
}
