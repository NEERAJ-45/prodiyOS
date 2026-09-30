import { NextResponse } from 'next/server';
import {
  assertReaderKeyConfigured,
  checkKey,
  isAllowedMediumUrl,
  fetchArticle,
  extractToMarkdown,
  renderMarkdown,
} from '@/lib/reader';
import { logReaderEvent } from '@/lib/reader-log';
import { connectToDatabase } from '@/lib/db';
import ReaderArticle from '@/lib/models/ReaderArticle';
import { getDbUri } from '../../db/request';

export const runtime = 'nodejs';

// Fail fast at boot/build if READER_KEY was never configured.
assertReaderKeyConfigured();

const FRIENDLY = "Couldn't extract it, likely paywalled or blocked";

function respond(body: unknown, status: number, reqId: string): NextResponse {
  return NextResponse.json(body, { status, headers: { 'X-Request-Id': reqId } });
}

export async function POST(request: Request): Promise<NextResponse> {
  const reqId = Math.random().toString(36).slice(2, 10);
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const key = typeof body.key === 'string' ? body.key : '';
    const url = typeof body.url === 'string' ? body.url : '';

    if (!checkKey(key)) {
      logReaderEvent('warn', 'key-check', 'invalid key attempt', { reqId });
      return respond({ error: 'Invalid access key' }, 403, reqId);
    }

    if (!isAllowedMediumUrl(url)) {
      logReaderEvent('warn', 'url-allowlist', 'rejected url', { reqId, url: url.slice(0, 200) });
      return respond({ error: 'Only medium.com URLs are allowed' }, 400, reqId);
    }

    const fetched = await fetchArticle(url);
    if (!fetched.ok) {
      logReaderEvent('warn', 'fetch', 'fetch failed', { reqId, url, reason: fetched.reason });
      return respond({ error: FRIENDLY }, 422, reqId);
    }

    const extracted = extractToMarkdown(fetched.html);
    if (!extracted.ok) {
      logReaderEvent('warn', 'extract', 'extraction failed', {
        reqId,
        url,
        reason: extracted.reason,
        htmlLen: fetched.html.length,
      });
      return respond({ error: FRIENDLY }, 422, reqId);
    }

    const html = renderMarkdown(extracted.markdown);

    // Save is best-effort: reading still works when the DB is down.
    let saved = false;
    try {
      const conn = await connectToDatabase(getDbUri(request));
      if (conn) {
        await ReaderArticle.findOneAndUpdate(
          { url },
          {
            url,
            title: extracted.title,
            html,
            searchText: extracted.searchText,
            source: 'medium',
          },
          { upsert: true, new: true }
        );
        saved = true;
      }
    } catch (e) {
      logReaderEvent('error', 'save', 'db upsert failed', {
        reqId,
        reason: e instanceof Error ? e.message : 'unknown',
      });
    }

    logReaderEvent('info', 'read', 'article extracted', {
      reqId,
      url,
      title: extracted.title.slice(0, 120),
      saved: String(saved),
    });
    return respond({ title: extracted.title, html, url, saved }, 200, reqId);
  } catch (e) {
    logReaderEvent('error', 'unexpected', 'unhandled error', {
      reqId,
      stack: e instanceof Error ? e.stack : String(e),
    });
    return respond({ error: 'Something went wrong' }, 500, reqId);
  }
}
