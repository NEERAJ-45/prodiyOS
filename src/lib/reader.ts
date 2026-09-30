import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export const IMAGE_HOSTS = new Set(['miro.medium.com', 'cdn-images-1.medium.com']);

export function assertReaderKeyConfigured(): void {
  if (!process.env.READER_KEY) {
    throw new Error('READER_KEY environment variable is not set');
  }
}

export function checkKey(submitted: string): boolean {
  assertReaderKeyConfigured();
  // Hash both sides to fixed 32 bytes: timingSafeEqual never throws on length
  // mismatch and the comparison leaks nothing about key length or content.
  const a = crypto.createHash('sha256').update(submitted, 'utf8').digest();
  const b = crypto.createHash('sha256').update(process.env.READER_KEY!, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

export function isAllowedMediumUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  // hostname comes from the URL parser, so "medium.com@evil.com" already
  // resolves to evil.com and "medium.com.evil.com" fails both checks.
  return host === 'medium.com' || host.endsWith('.medium.com');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isAllowedImageUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  return u.protocol === 'https:' && IMAGE_HOSTS.has(u.hostname.toLowerCase());
}

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function renderMarkdown(markdown: string): string {
  const out: string[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      out.push(`<h2>${escapeHtml(line.replace(/^#+\s*/, ''))}</h2>`);
      continue;
    }

    const img = line.match(IMAGE_LINE_RE);
    if (img) {
      // Disallowed host → silently dropped (spec); never fetched server-side.
      // Logging of drops is wired up in Task 4 (logger).
      if (isAllowedImageUrl(img[2])) {
        out.push(
          `<figure><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" loading="lazy" referrerpolicy="no-referrer"></figure>`
        );
      }
      continue;
    }

    out.push(`<p>${escapeHtml(line)}</p>`);
  }
  return out.join('\n');
}

export type FetchResult = { ok: true; html: string } | { ok: false; reason: string };
export type ExtractResult =
  | { ok: true; title: string; markdown: string; searchText: string }
  | { ok: false; reason: string };

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export async function fetchArticle(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
      headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true, html: await res.text() };
  } catch (e) {
    // jsdom's DOMException does not share the sandbox's Error.prototype, so
    // instanceof Error alone misses TimeoutError rejections in tests.
    const name =
      e instanceof Error || e instanceof DOMException ? e.name : 'unknown';
    return { ok: false, reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : name };
  }
}

// Strip markdown noise so library search runs over readable plain text.
function toSearchText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractToMarkdown(html: string): ExtractResult {
  try {
    const dom = new JSDOM(html, { url: 'https://medium.com/' });
    const doc = dom.window.document;
    // Capture before Readability mutates the doc; Readability reverts to
    // <title> for short titles, so the article's h1 is the better title.
    const h1 = (doc.querySelector('h1')?.textContent || '').trim();
    const article = new Readability(doc).parse();
    if (!article || (article.textContent || '').trim().length < 200) {
      return { ok: false, reason: 'empty_or_paywalled' };
    }
    const markdown = new TurndownService({ headingStyle: 'atx' }).turndown(article.content ?? '');
    if (!markdown.trim()) return { ok: false, reason: 'no_markdown' };
    return {
      ok: true,
      title: h1 || (article.title || '').trim() || 'Untitled',
      markdown,
      searchText: toSearchText(markdown),
    };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.name : 'extract_error' };
  }
}
