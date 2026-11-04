import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import { convertDocxToHtml, fetchDocFile } from '@/lib/doc-extractor';

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
    const doc = await Doc.findOne(query).select('+fileData fileUrl fileType').lean();
    if (!doc) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const buffer = doc.fileData
      ? Buffer.from(doc.fileData.buffer)
      : doc.fileUrl
        ? await fetchDocFile(doc.fileUrl)
        : null;
    if (!buffer) {
      return NextResponse.json({ error: 'Doc content not found' }, { status: 404 });
    }

    if (doc.fileType === 'docx') {
      const html = await convertDocxToHtml(buffer);
      return NextResponse.json({ type: 'docx', html });
    }

    return NextResponse.json({ type: 'md', text: buffer.toString('utf-8') });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load doc content' },
      { status: 500 }
    );
  }
}
