import { NextResponse } from 'next/server';
import { assertReaderKeyConfigured, checkKey } from '@/lib/reader';
import { logReaderEvent } from '@/lib/reader-log';
import { connectToDatabase } from '@/lib/db';
import ReaderArticle from '@/lib/models/ReaderArticle';
import { getDbUri } from '../../db/request';

export const runtime = 'nodejs';

function respond(body: unknown, status: number, reqId: string): NextResponse {
  return NextResponse.json(body, { status, headers: { 'X-Request-Id': reqId } });
}

// MongoDB $regex is built from user input — escape metacharacters so a query
// like "c++" can't throw or behave unexpectedly.
function safeRegex(q: string): RegExp {
  return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export async function GET(request: Request): Promise<NextResponse> {
  const reqId = Math.random().toString(36).slice(2, 10);
  try {
    // Checked per-request so `next build` works without READER_KEY set.
    assertReaderKeyConfigured();
    const key = request.headers.get('x-reader-key') || '';
    if (!checkKey(key)) {
      logReaderEvent('warn', 'key-check', 'invalid key on list', { reqId });
      return respond({ error: 'Invalid access key' }, 403, reqId);
    }

    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');
    const q = (searchParams.get('q') || '').trim();

    const conn = await connectToDatabase(getDbUri(request));
    if (!conn) {
      return respond({ articles: [] }, 200, reqId);
    }

    if (urlParam) {
      const doc = await ReaderArticle.findOne({ url: urlParam }).lean();
      if (!doc) {
        return respond({ error: 'Not found' }, 404, reqId);
      }
      return respond(
        { article: { url: doc.url, title: doc.title, html: doc.html, updatedAt: doc.updatedAt } },
        200,
        reqId
      );
    }

    const filter = q ? { $or: [{ title: safeRegex(q) }, { searchText: safeRegex(q) }] } : {};
    const articles = await ReaderArticle.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('url title updatedAt')
      .lean();
    return respond({ articles }, 200, reqId);
  } catch (e) {
    logReaderEvent('error', 'unexpected', 'list failed', {
      reqId,
      stack: e instanceof Error ? e.stack : String(e),
    });
    return respond({ error: 'Something went wrong' }, 500, reqId);
  }
}
