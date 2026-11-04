import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import Doc from '@/lib/models/Doc';
import DocContent from '@/lib/models/DocContent';
import { detectDocFileType, extractDocText, fetchDocFile, type DocFileType } from '@/lib/doc-extractor';
import { logActivity } from '@/lib/activity-logger';
import { getDbUri } from '../request';

function getErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

const VALID_TYPES: DocFileType[] = ['pdf', 'docx', 'md'];

function docQuery(id: string) {
  return /^[a-f\d]{24}$/i.test(id) ? { $or: [{ id }, { _id: id }] } : { id };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email || '';
    if (!userEmail) {
      return NextResponse.json({ docs: [] });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ docs: [] });
    }

    const docs = await Doc.find({ userEmail }).sort({ id: -1 }).lean();
    return NextResponse.json({ docs });
  } catch {
    return NextResponse.json({ docs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email || '';
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      file = formData.get('file') as File | null;
      body = {
        title: formData.get('title'),
        category: formData.get('category'),
        status: formData.get('status'),
        progress: formData.get('progress'),
        fileName: file?.name || '',
        fileType: detectDocFileType(file?.name || ''),
      };
    } else {
      body = await request.json();
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const fileType = body.fileType as DocFileType;
    if (!VALID_TYPES.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if ((!file && !body.fileUrl) || !String(body.title || '').trim()) {
      return NextResponse.json({ error: 'title and file required' }, { status: 400 });
    }

    const docId = (body.id as string) || `d-${Date.now()}`;
    const fileBuffer = file && file.size > 0 ? Buffer.from(await file.arrayBuffer()) : undefined;

    const doc = await Doc.create({
      title: String(body.title).trim(),
      category: String(body.category || 'other'),
      status: body.status || 'TO_READ',
      progress: parseInt(String(body.progress ?? 0), 10) || 0,
      fileUrl: body.fileUrl || `/api/docs/read/${docId}`,
      fileType,
      fileName: String(body.fileName || file?.name || ''),
      fileData: fileBuffer,
      id: docId,
      userEmail,
    });

    logActivity(userEmail, `Added doc "${body.title}"`);

    try {
      const buffer = fileBuffer || (body.fileUrl ? await fetchDocFile(String(body.fileUrl)) : null);
      if (!buffer) throw new Error('No file data');
      const text = await extractDocText(buffer, fileType);
      const cleanText = text.replace(/\s+/g, ' ').trim();
      if (cleanText.length > 20) {
        await DocContent.findOneAndUpdate(
          { docId },
          {
            docId,
            title: String(body.title).trim(),
            category: String(body.category || 'other'),
            content: cleanText.slice(0, 50000),
            contentLength: cleanText.length,
            indexedAt: new Date(),
          },
          { upsert: true }
        );
      }
    } catch {
      // non-fatal: doc readable, just unsearchable
    }

    return NextResponse.json({ doc }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const session = await auth();
    const userEmail = session?.user?.email || '';

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Doc.findOne(docQuery(id));
    if (!existing) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }
    if (existing.userEmail !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail: _ignored, ...safeBody } = body as Record<string, unknown>;

    const doc = await Doc.findOneAndUpdate(
      docQuery(id),
      { $set: safeBody },
      { new: true, runValidators: true }
    ).lean();

    logActivity(existing.userEmail, `Updated doc "${doc.title}"`);

    return NextResponse.json({ doc });
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const session = await auth();
    const userEmail = session?.user?.email || '';

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Doc.findOne(docQuery(id));
    if (existing && existing.userEmail !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (existing) {
      logActivity(existing.userEmail, `Deleted doc "${existing.title}"`);
      await DocContent.deleteOne({ docId: existing?.id ?? id });
    }

    await Doc.deleteOne(docQuery(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return getErrorResponse(error);
  }
}
