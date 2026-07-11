import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { IResume } from '@/lib/models/Resume';
import '@/lib/models/Resume';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
    }

    const Resume = conn.model<IResume>('Resume');
    const doc = await Resume.findById(id).select('pdfData title');
    if (!doc || !doc.pdfData) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const pdfBytes = new Uint8Array(doc.pdfData.buffer);
    return new NextResponse(pdfBytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`,
        'Content-Length': String(doc.pdfData.length),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
