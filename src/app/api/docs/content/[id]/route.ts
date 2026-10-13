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

    const doc = await Doc.findOne({ id }).lean();
    if (!doc?.fileUrl) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const buffer = await fetchDocFile(doc.fileUrl);

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
