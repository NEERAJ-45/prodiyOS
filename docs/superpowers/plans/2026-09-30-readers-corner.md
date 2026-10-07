# Reader's Corner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal reader-mode page at `/reader` where the user pastes a Medium URL + access key, gets a clean escaped article view (find-in-page included), and saved articles are searchable via a library.

**Architecture:** Pure extraction/rendering logic lives in `src/lib/reader.ts` (server-only); two Next.js route handlers wire it to MongoDB (`ReaderArticle` model, best-effort saves); a client page at `src/app/(dashboard)/reader/page.tsx` consumes TanStack Query hooks. Logging goes to stdout + a best-effort file via `src/lib/reader-log.ts`.

**Tech Stack:** Next.js App Router (TypeScript), Mongoose, TanStack Query v5, `@mozilla/readability` + `jsdom` + `turndown` for extraction, Vitest for tests, Tailwind (existing dark-theme tokens) + a scoped `<style>` block for article typography.

**Spec:** `docs/superpowers/specs/2026-09-30-readers-corner-design.md` — the plan argues from the spec; executors read both.

## Global Constraints

- Access key: `READER_KEY` env var; compare with SHA-256 digests + `crypto.timingSafeEqual` (`checkKey`); never log the key, `x-reader-key` header, or `READER_KEY`.
- Fail fast: `assertReaderKeyConfigured()` runs at module top of both reader route modules; `checkKey` throws if `READER_KEY` unset.
- URL allowlist: `new URL()` parse; protocol must be `http:`/`https:`; hostname must equal `medium.com` or end with `.medium.com`.
- Image allowlist (exact): `miro.medium.com`, `cdn-images-1.medium.com`; https only; `loading="lazy"` + `referrerpolicy="no-referrer"`; server never fetches images.
- Exact user-facing messages: `Invalid access key` (403), `Only medium.com URLs are allowed` (400), `Couldn't extract it, likely paywalled or blocked` (422), `Something went wrong` (500).
- All renderer output escaped (text and attributes, quoted); no raw-HTML passthrough; client never imports `src/lib/reader.ts`.
- Every reader API response carries an `X-Request-Id` header that is also in its log line.
- Logging: structured line to console AND best-effort file append; file failure must never break a request; never log secrets.
- Page URL is `/reader` (inside `(dashboard)` route group); no nav-link integration.
- Verification for every task: `npm run typecheck`, `npm run lint`, `npm test` must pass before finishing.
- DB saves are best-effort: on DB failure still return the article with `saved: false`.

---

### Task 1: Dependencies + `checkKey` / URL allowlist

**Files:**
- Create: `src/lib/reader.ts`
- Test: `src/lib/__tests__/reader.test.ts`

**Interfaces:**
- Produces (used by all later tasks):
  - `checkKey(submitted: string): boolean` — throws if `READER_KEY` unset
  - `assertReaderKeyConfigured(): void` — throws if `READER_KEY` unset
  - `isAllowedMediumUrl(raw: string): boolean`
  - `IMAGE_HOSTS: Set<string>`

- [ ] **Step 1: Install dependencies**

```bash
npm install @mozilla/readability@^0.6.0 turndown@^7.2.4 jsdom@^29.1.1
npm install -D @types/turndown@^5.0.6 @types/mozilla-readability@^0.2.1
```

(`jsdom@^29.1.1` is already in devDependencies; this moves it to `dependencies` so the serverless runtime has it.)

- [ ] **Step 2: Write the failing test**

Create `src/lib/__tests__/reader.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';

// Env must be set before reader.ts functions are called; do it up front.
beforeAll(() => {
  process.env.READER_KEY = 'correct-horse-battery';
});

import { checkKey, assertReaderKeyConfigured, isAllowedMediumUrl } from '@/lib/reader';

describe('checkKey()', () => {
  it('accepts the exact key', () => {
    expect(checkKey('correct-horse-battery')).toBe(true);
  });

  it('rejects a wrong key', () => {
    expect(checkKey('wrong-key')).toBe(false);
    expect(checkKey('')).toBe(false);
  });

  it('throws when READER_KEY is unset', () => {
    const saved = process.env.READER_KEY;
    delete process.env.READER_KEY;
    expect(() => checkKey('anything')).toThrow(/READER_KEY/);
    expect(() => assertReaderKeyConfigured()).toThrow(/READER_KEY/);
    process.env.READER_KEY = saved;
  });
});

describe('isAllowedMediumUrl()', () => {
  it('accepts medium.com and subdomains over http/https', () => {
    expect(isAllowedMediumUrl('https://medium.com/@user/some-post-abc123')).toBe(true);
    expect(isAllowedMediumUrl('https://blog.medium.com/nice-article/')).toBe(true);
    expect(isAllowedMediumUrl('http://foo.medium.com/post')).toBe(true);
    expect(isAllowedMediumUrl('https://medium.com')).toBe(true);
  });

  it('rejects tricky non-medium hosts', () => {
    expect(isAllowedMediumUrl('https://evilmedium.com/post')).toBe(false);
    expect(isAllowedMediumUrl('https://medium.com.evil.com/post')).toBe(false);
    expect(isAllowedMediumUrl('https://notmedium.com/post')).toBe(false);
    expect(isAllowedMediumUrl('https://sub.medium.com.evil.com/x')).toBe(false);
    expect(isAllowedMediumUrl('https://evil.com/?x=medium.com')).toBe(false);
  });

  it('rejects non-http(s) schemes and garbage', () => {
    expect(isAllowedMediumUrl('ftp://medium.com/file')).toBe(false);
    expect(isAllowedMediumUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedMediumUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedMediumUrl('not a url')).toBe(false);
    expect(isAllowedMediumUrl('')).toBe(false);
  });

  it('rejects credentials-in-URL tricks', () => {
    // URL parser treats everything after @ as host → evil.com wins
    expect(isAllowedMediumUrl('https://medium.com@evil.com/post')).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/__tests__/reader.test.ts`
Expected: FAIL — module `@/lib/reader` not found.

- [ ] **Step 4: Write the minimal implementation**

Create `src/lib/reader.ts`:

```ts
import crypto from 'crypto';

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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/reader.test.ts`
Expected: PASS (all key + allowlist tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/reader.ts src/lib/__tests__/reader.test.ts
git commit -m "feat(reader): add reader core — timing-safe key check and medium URL allowlist"
```

---

### Task 2: Escaping + custom markdown renderer

**Files:**
- Modify: `src/lib/reader.ts` (append exports)
- Test: `src/lib/__tests__/reader.test.ts` (append describes)

**Interfaces:**
- Produces (used by Task 5 route):
  - `escapeHtml(s: string): string`
  - `renderMarkdown(markdown: string): string`
  - `isAllowedImageUrl(raw: string): boolean`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/reader.test.ts`:

```ts
import { escapeHtml, renderMarkdown, isAllowedImageUrl } from '@/lib/reader';

describe('escapeHtml()', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;'
    );
  });
});

describe('isAllowedImageUrl()', () => {
  it('accepts https on the two allowlisted hosts', () => {
    expect(isAllowedImageUrl('https://miro.medium.com/v2/resize:fit:800/x')).toBe(true);
    expect(isAllowedImageUrl('https://cdn-images-1.medium.com/v2/abc')).toBe(true);
  });

  it('rejects other hosts and non-https', () => {
    expect(isAllowedImageUrl('https://evil.com/x.png')).toBe(false);
    expect(isAllowedImageUrl('http://miro.medium.com/x')).toBe(false);
    expect(isAllowedImageUrl('https://sub.miro.medium.com/x')).toBe(false);
    expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedImageUrl('not-a-url')).toBe(false);
  });
});

describe('renderMarkdown()', () => {
  it('renders headings as h2 with escaped text', () => {
    const html = renderMarkdown('# Hello <script>alert(1)</script>');
    expect(html).toBe('<h2>Hello &lt;script&gt;alert(1)&lt;/script&gt;</h2>');
  });

  it('renders plain lines as escaped paragraphs', () => {
    const html = renderMarkdown('Buy <b>now</b> & more');
    expect(html).toBe('<p>Buy &lt;b&gt;now&lt;/b&gt; &amp; more</p>');
  });

  it('renders allowlisted images with lazy/no-referrer in a figure', () => {
    const html = renderMarkdown('![a "quoted" alt](https://miro.medium.com/v2/x)');
    expect(html).toBe(
      '<figure><img src="https://miro.medium.com/v2/x" alt="a &quot;quoted&quot; alt" loading="lazy" referrerpolicy="no-referrer"></figure>'
    );
  });

  it('drops images from non-allowlisted hosts entirely', () => {
    expect(renderMarkdown('![x](https://evil.com/x.png)')).toBe('');
    expect(renderMarkdown('![x](http://miro.medium.com/x)')).toBe('');
  });

  it('neutralizes attribute injection via image URL/alt', () => {
    const html = renderMarkdown('![x" onerror="alert(1)](https://miro.medium.com/x)');
    expect(html).not.toContain('onerror="alert');
    expect(html).toContain('alt="x&quot; onerror=&quot;alert(1)"');
  });

  it('skips empty lines and escapes a raw <img> in a paragraph line', () => {
    const html = renderMarkdown('line one\n\n<img src=x onerror=alert(1)>');
    expect(html).toBe('<p>line one</p>\n<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/reader.test.ts`
Expected: FAIL — `escapeHtml`/`renderMarkdown`/`isAllowedImageUrl` not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/reader.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/reader.test.ts`
Expected: PASS — all tests in the file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reader.ts src/lib/__tests__/reader.test.ts
git commit -m "feat(reader): add escaped custom markdown renderer with image allowlist"
```

---

### Task 3: Fetch + extraction (readability → turndown)

**Files:**
- Modify: `src/lib/reader.ts` (append exports)
- Test: `src/lib/__tests__/reader.test.ts` (append describes)

**Interfaces:**
- Produces (used by Task 5 route):
  - `fetchArticle(url: string): Promise<{ ok: true; html: string } | { ok: false; reason: string }>`
  - `extractToMarkdown(html: string): { ok: true; title: string; markdown: string; searchText: string } | { ok: false; reason: string }`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/reader.test.ts`:

```ts
import { afterEach, vi } from 'vitest';
import { fetchArticle, extractToMarkdown } from '@/lib/reader';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchArticle()', () => {
  it('returns html on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>hi</html>', { status: 200 })));
    const r = await fetchArticle('https://medium.com/x');
    expect(r).toEqual({ ok: true, html: '<html>hi</html>' });
  });

  it('maps non-2xx to http_<status> reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));
    const r = await fetchArticle('https://medium.com/x');
    expect(r).toEqual({ ok: false, reason: 'http_403' });
  });

  it('maps timeout to timeout reason instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')));
    const r = await fetchArticle('https://medium.com/x');
    expect(r).toEqual({ ok: false, reason: 'timeout' });
  });
});

describe('extractToMarkdown()', () => {
  it('extracts title and markdown from a real-shaped article', () => {
    const html = `<html><head><title>ignored</title></head><body>
      <article><h1>My Great Post</h1><p>${'This is article text. '.repeat(20)}</p></article>
    </body></html>`;
    const r = extractToMarkdown(html);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.title).toBe('My Great Post');
      expect(r.markdown).toContain('This is article text.');
      expect(r.searchText).toContain('This is article text.');
      expect(r.searchText).not.toContain('#');
    }
  });

  it('fails friendly on a nearly-empty (paywalled) page', () => {
    const r = extractToMarkdown('<html><body><p>Members only.</p></body></html>');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('empty_or_paywalled');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/reader.test.ts`
Expected: FAIL — `fetchArticle`/`extractToMarkdown` not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/reader.ts`:

```ts
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

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
    const name = e instanceof Error ? e.name : 'unknown';
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
    const article = new Readability(dom.window.document).parse();
    if (!article || (article.textContent || '').trim().length < 200) {
      return { ok: false, reason: 'empty_or_paywalled' };
    }
    const markdown = new TurndownService({ headingStyle: 'atx' }).turndown(article.content);
    if (!markdown.trim()) return { ok: false, reason: 'no_markdown' };
    return {
      ok: true,
      title: (article.title || '').trim() || 'Untitled',
      markdown,
      searchText: toSearchText(markdown),
    };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.name : 'extract_error' };
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/reader.test.ts`
Expected: PASS — entire suite green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reader.ts src/lib/__tests__/reader.test.ts
git commit -m "feat(reader): add fetch with timeout/UA and readability+turndown extraction"
```

---

### Task 4: Logger (`src/lib/reader-log.ts`)

**Files:**
- Create: `src/lib/reader-log.ts`
- Test: `src/lib/__tests__/reader-log.test.ts`

**Interfaces:**
- Produces (used by Tasks 5 and 6):
  - `logReaderEvent(level: 'debug' | 'info' | 'warn' | 'error', stage: string, message: string, meta?: Record<string, string | number | undefined>): void`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/reader-log.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { logReaderEvent } from '@/lib/reader-log';

let dir: string | undefined;

afterEach(() => {
  delete process.env.READER_LOG_DIR;
  if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

describe('logReaderEvent()', () => {
  it('appends a structured line to the file', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-log-'));
    process.env.READER_LOG_DIR = dir;
    logReaderEvent('warn', 'fetch', 'fetch failed', { reqId: 'abc123', reason: 'timeout' });
    const content = fs.readFileSync(path.join(dir, 'reader.log'), 'utf8');
    expect(content).toContain('WARN fetch: fetch failed');
    expect(content).toContain('reqId=abc123');
    expect(content).toContain('reason=timeout');
    expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
  });

  it('never throws when the log file path is unwritable', () => {
    process.env.READER_LOG_DIR = 'Z:\\definitely\\not\\a\\real\\path\u0000';
    expect(() => logReaderEvent('error', 'unexpected', 'boom', { stack: 'Error: x' })).not.toThrow();
  });

  it('collapses whitespace in meta values (single-line logs)', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-log-'));
    process.env.READER_LOG_DIR = dir;
    logReaderEvent('error', 'unexpected', 'boom', { stack: 'Error: x\n    at foo\n    at bar' });
    const content = fs.readFileSync(path.join(dir, 'reader.log'), 'utf8');
    expect(content.split('\n').filter(Boolean).length).toBe(1);
    expect(content).not.toContain('\n    at');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/__tests__/reader-log.test.ts`
Expected: FAIL — `@/lib/reader-log` not found.

- [ ] **Step 3: Implement**

Create `src/lib/reader-log.ts`:

```ts
import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const MAX_BYTES = 1_000_000;

function logFilePath(): string {
  if (process.env.READER_LOG_DIR) return path.join(process.env.READER_LOG_DIR, 'reader.log');
  // Vercel's filesystem is read-only except /tmp (ephemeral per instance —
  // stdout below is the durable copy shown in the dashboard Logs view).
  if (process.env.VERCEL) return '/tmp/reader.log';
  return path.join(process.cwd(), 'logs', 'reader.log');
}

function flatten(v: string | number | undefined): string {
  if (v === undefined) return '';
  // One event = one line; keeps stack traces grep-able.
  return String(v).replace(/\s+/g, ' ');
}

function rotateIfNeeded(file: string): void {
  try {
    if (fs.statSync(file).size > MAX_BYTES) fs.renameSync(file, `${file}.1`);
  } catch {
    // File doesn't exist yet or stat failed — nothing to rotate.
  }
}

export function logReaderEvent(
  level: LogLevel,
  stage: string,
  message: string,
  meta: Record<string, string | number | undefined> = {}
): void {
  const parts = Object.entries(meta)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${flatten(v)}`);
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${stage}: ${message}${
    parts.length ? ' ' + parts.join(' ') : ''
  }`;

  // Durable sink (Vercel dashboard, local terminal). Callers must never pass secrets.
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  // Best-effort file sink — any failure is swallowed so logging can never
  // break an API request.
  try {
    const file = logFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    rotateIfNeeded(file);
    fs.appendFileSync(file, `${line}\n`, 'utf8');
  } catch {
    // ignore
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/reader-log.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the renderer's dropped-image debug log (spec §6a `render` stage)**

Add to the top of `src/lib/reader.ts` (next to the `crypto` import):

```ts
import { logReaderEvent } from '@/lib/reader-log';
```

Replace the image branch inside `renderMarkdown` in `src/lib/reader.ts`:

```ts
    const img = line.match(IMAGE_LINE_RE);
    if (img) {
      // Disallowed host → dropped from output, never fetched server-side,
      // but logged at debug so missing images are diagnosable.
      if (isAllowedImageUrl(img[2])) {
        out.push(
          `<figure><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" loading="lazy" referrerpolicy="no-referrer"></figure>`
        );
      } else {
        let host = '';
        try {
          host = new URL(img[2]).hostname;
        } catch {
          host = 'invalid-url';
        }
        logReaderEvent('debug', 'render', 'image dropped', { host });
      }
      continue;
    }
```

Then append this test to `src/lib/__tests__/reader.test.ts` (`vi`/`afterEach` are already imported from Task 3; a second `afterEach` hook is fine):

```ts
it('logs a debug line when an image host is dropped', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  renderMarkdown('![x](https://evil.com/x.png)');
  expect(spy.mock.calls.flat().join('\n')).toContain('render: image dropped');
  expect(spy.mock.calls.flat().join('\n')).toContain('host=evil.com');
  spy.mockRestore();
});
```

- [ ] **Step 6: Run both test files to verify they pass**

Run: `npx vitest run src/lib/__tests__/reader.test.ts src/lib/__tests__/reader-log.test.ts`
Expected: PASS — full suite green, dropped-image log asserted.

- [ ] **Step 7: Commit**

```bash
git add src/lib/reader-log.ts src/lib/reader.ts src/lib/__tests__/reader-log.test.ts src/lib/__tests__/reader.test.ts
git commit -m "feat(reader): add structured stdout+file logger with rotation"
```

---

### Task 5: `ReaderArticle` model + `POST /api/reader/read`

**Files:**
- Create: `src/lib/models/ReaderArticle.ts`
- Create: `src/app/api/reader/read/route.ts`
- Test: `src/lib/__tests__/reader-route.test.ts`

**Interfaces:**
- Consumes: `checkKey`, `assertReaderKeyConfigured`, `isAllowedMediumUrl`, `fetchArticle`, `extractToMarkdown`, `renderMarkdown` (Task 1–3); `logReaderEvent` (Task 4); `connectToDatabase` from `@/lib/db`; `getDbUri` from `../../db/request`.
- Produces (used by Task 8 hooks):
  - `POST /api/reader/read` body `{ key, url }` → 403 / 400 / 422 / 500 / 200 `{ title, html, url, saved }`, all with `X-Request-Id`.
  - Mongoose model default export `ReaderArticle` with fields `url` (unique), `title`, `html`, `searchText`, `source`, timestamps.

- [ ] **Step 1: Create the model**

Create `src/lib/models/ReaderArticle.ts` (mirrors `src/lib/models/Article.ts` conventions):

```ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IReaderArticle extends Document {
  url: string;
  title: string;
  html: string;
  searchText: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReaderArticleSchema: Schema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    html: { type: String, default: '' },
    searchText: { type: String, default: '' },
    source: { type: String, default: 'medium' },
  },
  { timestamps: true }
);

export default mongoose.models.ReaderArticle ||
  mongoose.model<IReaderArticle>('ReaderArticle', ReaderArticleSchema);
```

- [ ] **Step 2: Write the failing route tests**

Create `src/lib/__tests__/reader-route.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

// Must run before the route module is imported: the route calls
// assertReaderKeyConfigured() at module top level (fail-fast requirement).
vi.hoisted(() => {
  process.env.READER_KEY = 'correct-horse-battery';
});

const { POST } = await import('@/app/api/reader/read/route');

function post(body: unknown): Request {
  return new Request('http://localhost/api/reader/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/reader/read', () => {
  it('returns 403 for a wrong key', async () => {
    const res = await POST(post({ key: 'nope', url: 'https://medium.com/@u/a' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Invalid access key');
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('returns 400 for a non-medium host even with the right key', async () => {
    const res = await POST(post({ key: 'correct-horse-battery', url: 'https://evilmedium.com/x' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Only medium.com URLs are allowed');
  });

  it('returns 400 for medium.com.evil.com', async () => {
    const res = await POST(post({ key: 'correct-horse-battery', url: 'https://medium.com.evil.com/x' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed urls', async () => {
    const res = await POST(post({ key: 'correct-horse-battery', url: 'not-a-url' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 with the friendly message when fetch fails (no network)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('x', 'TimeoutError')));
    const res = await POST(post({ key: 'correct-horse-battery', url: 'https://medium.com/@u/a' }));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("Couldn't extract it, likely paywalled or blocked");
    vi.unstubAllGlobals();
  });

  it('never logs the submitted access key', async () => {
    const spies = (['log', 'warn', 'error'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {})
    );
    await POST(post({ key: 'correct-horse-battery', url: 'https://evilmedium.com/x' }));
    await POST(post({ key: 'wrong-key-should-not-appear', url: 'https://medium.com/x' }));
    const logged = spies.flatMap((s) => s.mock.calls.flat().map(String)).join('\n');
    expect(logged).not.toContain('correct-horse-battery');
    expect(logged).not.toContain('wrong-key-should-not-appear');
    spies.forEach((s) => s.mockRestore());
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/reader-route.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 4: Implement the route**

Create `src/app/api/reader/read/route.ts`:

```ts
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
      saved,
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/reader-route.test.ts`
Expected: PASS (all 5 route tests; the 422 test stubs `fetch`, and DB save fails silently into `saved: false` if no DB — that's expected in tests, the response is still 200 only in the extraction-success path which these tests don't reach except via stubbed failures).

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npm run typecheck && npm test`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/models/ReaderArticle.ts src/app/api/reader/read/route.ts src/lib/__tests__/reader-route.test.ts
git commit -m "feat(reader): add ReaderArticle model and POST /api/reader/read route"
```

---

### Task 6: `GET /api/reader/articles` (library list + single article)

**Files:**
- Create: `src/app/api/reader/articles/route.ts`

**Interfaces:**
- Consumes: `checkKey`, `assertReaderKeyConfigured` (Task 1); `logReaderEvent` (Task 4); `ReaderArticle` model, `connectToDatabase`, `getDbUri` (Task 5).
- Produces (used by Task 8 hooks):
  - `GET` with header `x-reader-key`:
    - `?q=<term>` → `{ articles: { url, title, updatedAt }[] }` (max 50, sorted `updatedAt` desc)
    - `?url=<url>` → `{ article: { url, title, html, updatedAt } }` or 404 `{ error: 'Not found' }`
    - 403 on bad key; 500 `{ error: 'Something went wrong' }` on unexpected errors; all with `X-Request-Id`.

- [ ] **Step 1: Implement the route**

Create `src/app/api/reader/articles/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { assertReaderKeyConfigured, checkKey } from '@/lib/reader';
import { logReaderEvent } from '@/lib/reader-log';
import { connectToDatabase } from '@/lib/db';
import ReaderArticle from '@/lib/models/ReaderArticle';
import { getDbUri } from '../../db/request';

export const runtime = 'nodejs';

assertReaderKeyConfigured();

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
```

- [ ] **Step 2: Typecheck + lint + tests**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass. (No automated DB test — Mongo isn't available in unit tests; behavior verified in Task 10 smoke test.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reader/articles/route.ts
git commit -m "feat(reader): add GET /api/reader/articles with search and single-fetch modes"
```

---

### Task 7: Find-in-article highlight utility

**Files:**
- Create: `src/lib/reader-highlight.ts`
- Test: `src/lib/__tests__/reader-highlight.test.ts`

**Interfaces:**
- Consumes: browser DOM only (client-side; loaded by the page in Task 9).
- Produces:
  - `highlightText(root: HTMLElement, query: string): HTMLElement[]` — wraps matches in `<mark data-reader-mark>`, returns the marks
  - `clearHighlights(root: HTMLElement): void` — unwraps marks, restores original text

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/reader-highlight.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { highlightText, clearHighlights } from '@/lib/reader-highlight';

let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('highlightText()', () => {
  it('wraps matches in mark elements and returns them', () => {
    root.innerHTML = '<p>alpha beta alpha</p>';
    const marks = highlightText(root, 'alpha');
    expect(marks.length).toBe(2);
    expect(root.querySelectorAll('mark[data-reader-mark]').length).toBe(2);
    expect(root.textContent).toBe('alpha beta alpha');
  });

  it('is case-insensitive', () => {
    root.innerHTML = '<p>Hello WORLD</p>';
    expect(highlightText(root, 'world').length).toBe(1);
  });

  it('matches across separate text nodes', () => {
    root.innerHTML = '<p>one <strong>two</strong> one</p>';
    expect(highlightText(root, 'one').length).toBe(2);
  });

  it('returns empty array for empty query', () => {
    root.innerHTML = '<p>text</p>';
    expect(highlightText(root, '   ')).toHaveLength(0);
    expect(root.querySelectorAll('mark').length).toBe(0);
  });
});

describe('clearHighlights()', () => {
  it('restores the original text exactly', () => {
    root.innerHTML = '<p>one two one</p>';
    highlightText(root, 'one');
    clearHighlights(root);
    expect(root.querySelectorAll('mark').length).toBe(0);
    expect(root.textContent).toBe('one two one');
    // Node is normalized back to a single text node per element
    expect((root.querySelector('p')!.firstChild as Text).nodeValue).toBe('one two one');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/__tests__/reader-highlight.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/reader-highlight.ts`:

```ts
const MARK_SELECTOR = 'mark[data-reader-mark]';

export function clearHighlights(root: HTMLElement): void {
  root.querySelectorAll(MARK_SELECTOR).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize(); // merge split text nodes back together
  });
}

export function highlightText(root: HTMLElement, query: string): HTMLElement[] {
  clearHighlights(root);
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const marks: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    const lower = text.toLowerCase();
    if (!lower.includes(needle)) continue;
    const parent = textNode.parentNode;
    if (!parent) continue;

    const frag = document.createDocumentFragment();
    let last = 0;
    let pos = lower.indexOf(needle);
    while (pos !== -1) {
      if (pos > last) frag.appendChild(document.createTextNode(text.slice(last, pos)));
      const mark = document.createElement('mark');
      mark.setAttribute('data-reader-mark', '');
      mark.textContent = text.slice(pos, pos + needle.length);
      frag.appendChild(mark);
      marks.push(mark);
      last = pos + needle.length;
      pos = lower.indexOf(needle, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, textNode);
  }
  return marks;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/reader-highlight.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reader-highlight.ts src/lib/__tests__/reader-highlight.test.ts
git commit -m "feat(reader): add client-side find-in-article highlight utility"
```

---

### Task 8: TanStack Query hooks (`src/hooks/use-reader.ts`)

**Files:**
- Create: `src/hooks/use-reader.ts`

**Interfaces:**
- Consumes: HTTP routes from Tasks 5–6; `useProfile()` from `@/components/providers/ProfileProvider` (gives `customDbUrl`, sent as `x-mongodb-url` like `use-articles.ts` does).
- Produces (used by Task 9 page):
  - `class ReaderError extends Error { status: number }`
  - `getStoredKey(): string` / `storeKey(key: string): void` — sessionStorage under `reader-access-key`
  - `useReadArticle()` → mutation `mutate({ key, url })` → resolves `{ title, html, url, saved }`; invalidates `['reader-articles']`
  - `useReaderArticlesQuery(key: string, q: string)` → `{ articles: { url, title, updatedAt }[] }`, enabled only when `key` non-empty
  - `useReaderArticleQuery(key: string, url: string | null)` → `{ article: { url, title, html, updatedAt } }`, enabled only when both set

- [ ] **Step 1: Implement the hook**

Create `src/hooks/use-reader.ts`:

```ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

const STORAGE_KEY = 'reader-access-key';

export class ReaderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) || '';
}

export function storeKey(key: string): void {
  sessionStorage.setItem(STORAGE_KEY, key);
}

function makeHeaders(key: string, customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'x-reader-key': key };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

export interface ReaderArticleSummary {
  url: string;
  title: string;
  updatedAt: string;
}

export function useReadArticle() {
  const { customDbUrl } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, url }: { key: string; url: string }) => {
      const res = await fetch('/api/reader/read', {
        method: 'POST',
        headers: { ...makeHeaders(key, customDbUrl), 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, url }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ReaderError(res.status, json.error || 'Something went wrong');
      }
      return json as { title: string; html: string; url: string; saved: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reader-articles'] });
    },
  });
}

export function useReaderArticlesQuery(key: string, q: string) {
  const { customDbUrl } = useProfile();

  return useQuery<{ articles: ReaderArticleSummary[] }>({
    queryKey: ['reader-articles', q],
    queryFn: async () => {
      const res = await fetch(`/api/reader/articles?q=${encodeURIComponent(q)}`, {
        headers: makeHeaders(key, customDbUrl),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ReaderError(res.status, json.error || 'Something went wrong');
      return json;
    },
    enabled: !!key,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useReaderArticleQuery(key: string, url: string | null) {
  const { customDbUrl } = useProfile();

  return useQuery<{ article: { url: string; title: string; html: string; updatedAt: string } }>({
    queryKey: ['reader-article', url],
    queryFn: async () => {
      const res = await fetch(`/api/reader/articles?url=${encodeURIComponent(url!)}`, {
        headers: makeHeaders(key, customDbUrl),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ReaderError(res.status, json.error || 'Something went wrong');
      return json;
    },
    enabled: !!key && !!url,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-reader.ts
git commit -m "feat(reader): add TanStack Query hooks for read and library"
```

---

### Task 9: Reader's Corner page (`src/app/(dashboard)/reader/page.tsx`)

**Files:**
- Create: `src/app/(dashboard)/reader/page.tsx`

**Interfaces:**
- Consumes: Task 8 hooks; `highlightText`/`clearHighlights` from Task 7.
- Produces: the `/reader` UI — Read form, Article view (with find-in-article), Library (with search).

- [ ] **Step 1: Implement the page**

Create `src/app/(dashboard)/reader/page.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useReadArticle,
  useReaderArticlesQuery,
  useReaderArticleQuery,
  getStoredKey,
  storeKey,
  ReaderError,
} from '@/hooks/use-reader';
import { highlightText, clearHighlights } from '@/lib/reader-highlight';

const ARTICLE_CSS = `
.reader-article { max-width: 680px; margin: 0 auto; font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; font-size: 1.05rem; color: #e7e7ea; }
.reader-article h2 { font-size: 1.45rem; font-weight: 700; margin: 1.8rem 0 0.8rem; line-height: 1.3; }
.reader-article h2:first-child { margin-top: 0; }
.reader-article p { margin: 0 0 1.15rem; }
.reader-article figure { margin: 1.6rem 0; }
.reader-article img { display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 0 auto; }
.reader-article mark[data-reader-mark] { background: #fde047; color: #111; border-radius: 2px; padding: 0 1px; }
@media (prefers-color-scheme: light) {
  .reader-article { color: #1f1f22; }
}
`;

type View = 'form' | 'article' | 'library';

export default function ReaderPage() {
  const [key, setKey] = useState('');
  const [url, setUrl] = useState('');
  const [view, setView] = useState<View>('form');
  const [article, setArticle] = useState<{ title: string; html: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [libraryQ, setLibraryQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const articleRef = useRef<HTMLDivElement>(null);

  const readMutation = useReadArticle();
  const libraryQuery = useReaderArticlesQuery(key, debouncedQ);
  const singleQuery = useReaderArticleQuery(key, openUrl);

  // sessionStorage is browser-only; read after mount to avoid hydration mismatch.
  useEffect(() => {
    setKey(getStoredKey());
  }, []);

  // Debounce library search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(libraryQ), 300);
    return () => clearTimeout(t);
  }, [libraryQ]);

  // Reset find state whenever the displayed article changes.
  useEffect(() => {
    setFindQuery('');
    setMatchCount(0);
    setMatchIdx(0);
  }, [article]);

  // A saved article was fetched → show it.
  useEffect(() => {
    if (openUrl && singleQuery.data?.article) {
      const a = singleQuery.data.article;
      setArticle({ title: a.title, html: a.html, url: a.url });
      setOpenUrl(null);
      setView('article');
    }
    if (singleQuery.isError && openUrl) {
      setError(singleQuery.error instanceof ReaderError ? singleQuery.error.message : 'Something went wrong');
      setOpenUrl(null);
    }
  }, [openUrl, singleQuery.data, singleQuery.isError, singleQuery.error]);

  function onRead(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    readMutation.mutate(
      { key, url },
      {
        onSuccess: (data) => {
          storeKey(key);
          setKey(key);
          setArticle({ title: data.title, html: data.html, url: data.url });
          setView('article');
          setNotice(data.saved ? '' : 'Read, but not saved (database unavailable).');
        },
        onError: (err) => {
          setError(err instanceof ReaderError ? err.message : 'Something went wrong');
        },
      }
    );
  }

  function applyFind(q: string) {
    setFindQuery(q);
    const root = articleRef.current;
    if (!root) return;
    const marks = highlightText(root, q);
    setMatchCount(marks.length);
    setMatchIdx(marks.length ? 1 : 0);
    if (marks.length) marks[0].scrollIntoView({ block: 'center' });
  }

  function stepFind(dir: 1 | -1) {
    const root = articleRef.current;
    if (!root || matchCount === 0) return;
    const next = (matchIdx - 1 + dir + matchCount) % matchCount;
    const marks = root.querySelectorAll('mark[data-reader-mark]');
    setMatchIdx(next + 1);
    marks[next]?.scrollIntoView({ block: 'center' });
  }

  function backToForm() {
    const root = articleRef.current;
    if (root) clearHighlights(root);
    setArticle(null);
    setError('');
    setNotice('');
    setView('form');
  }

  return (
    <div className="min-h-full bg-background">
      <style>{ARTICLE_CSS}</style>
      <div className="mx-auto w-full max-w-[720px] px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Reader&apos;s Corner</h1>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setView('form')}
              className={`rounded-md border px-3 py-1.5 ${view === 'form' ? 'bg-secondary' : 'border-border text-muted-foreground'}`}
            >
              Read
            </button>
            <button
              onClick={() => setView('library')}
              className={`rounded-md border px-3 py-1.5 ${view === 'library' ? 'bg-secondary' : 'border-border text-muted-foreground'}`}
            >
              Library
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {notice}
          </div>
        )}

        {view === 'form' && (
          <form onSubmit={onRead} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div>
              <label htmlFor="reader-key" className="mb-1 block text-sm font-medium">
                Access key
              </label>
              <input
                id="reader-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="reader-url" className="mb-1 block text-sm font-medium">
                Medium article URL
              </label>
              <input
                id="reader-url"
                type="url"
                inputMode="url"
                placeholder="https://medium.com/@author/title-…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={readMutation.isPending}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {readMutation.isPending ? 'Reading…' : 'Read'}
            </button>
          </form>
        )}

        {view === 'article' && article && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button onClick={backToForm} className="rounded-md border border-border px-3 py-1.5 text-sm">
                ← New article
              </button>
              <div className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm">
                <input
                  type="search"
                  placeholder="Find in article…"
                  value={findQuery}
                  onChange={(e) => applyFind(e.target.value)}
                  className="w-36 bg-transparent outline-none"
                  aria-label="Find in article"
                />
                {matchCount > 0 && (
                  <>
                    <span className="px-1 text-xs text-muted-foreground">
                      {matchIdx}/{matchCount}
                    </span>
                    <button onClick={() => stepFind(-1)} aria-label="Previous match" className="px-1">
                      ↑
                    </button>
                    <button onClick={() => stepFind(1)} aria-label="Next match" className="px-1">
                      ↓
                    </button>
                  </>
                )}
              </div>
            </div>
            <article className="reader-article" ref={articleRef} dangerouslySetInnerHTML={{ __html: article.html }} />
            <p className="mt-8 text-center text-xs text-muted-foreground">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline">
                View original on Medium
              </a>
            </p>
          </div>
        )}

        {view === 'library' && (
          <div>
            <input
              type="search"
              placeholder="Search saved articles…"
              value={libraryQ}
              onChange={(e) => setLibraryQ(e.target.value)}
              className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search saved articles"
            />
            {!key && (
              <p className="text-sm text-muted-foreground">Enter your access key on the Read tab first.</p>
            )}
            {key && libraryQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {key && libraryQuery.data?.articles.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved articles{debouncedQ ? ` matching “${debouncedQ}”` : ''}.</p>
            )}
            <ul className="space-y-2">
              {libraryQuery.data?.articles.map((a) => (
                <li key={a.url}>
                  <button
                    onClick={() => setOpenUrl(a.url)}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-secondary/50"
                  >
                    <span className="block font-medium">{a.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.url} · {new Date(a.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint + full test suite**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/reader/page.tsx"
git commit -m "feat(reader): add Reader's Corner page with form, article view, find, and library"
```

---

### Task 10: Documentation, gitignore, and full verification

**Files:**
- Modify: `README.md` (append section)
- Modify: `.gitignore` (add `logs/`)

**Interfaces:**
- Consumes: everything above.
- Produces: documented setup + a verified, working feature.

- [ ] **Step 1: Append `logs/` to `.gitignore`**

Read `.gitignore`, then append a Reader's Corner section:

```
# Reader's Corner local logs
logs/
```

- [ ] **Step 2: Append README section**

Read `README.md`, then append (outer fence uses four backticks because the content contains code fences):

````markdown
## Reader's Corner

Personal reader mode for Medium articles at `/reader`.

- Paste your access key + a `medium.com` article URL; the server extracts the
  article and renders a clean, escaped reading view.
- Saved articles are searchable from the **Library** tab; each article has a
  find-in-page box.
- Set the access key env var before running:

```bash
export READER_KEY='choose-a-long-random-secret'   # PowerShell: $env:READER_KEY="..."
npm run dev                                        # open http://localhost:3000/reader
```

On Vercel: add `READER_KEY` in Project → Settings → Environment Variables, then redeploy.

**Logs (failure diagnosis):** structured lines go to stdout (Vercel → Project → Logs)
and best-effort to `logs/reader.log` locally (`/tmp/reader.log` on Vercel,
override with `READER_LOG_DIR`). Each API response has an `X-Request-Id` header
matched to its log line. The access key is never logged.

**Known limitations:** paywalled/member-only articles extract little or nothing
(by design — no paywall bypass); some images are missing (only `miro.medium.com`
and `cdn-images-1.medium.com` are allowlisted); Medium may rate-limit datacenter
IPs; local runs need `medium.com` reachable from your machine (on a blocked
network, deploy instead — the server fetches, not your browser).
````

(If the README uses different heading levels, match its existing style.)

- [ ] **Step 3: Full verification**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 4: Live smoke test**

```bash
# Ensure READER_KEY is set in the environment, then:
npm run dev
```

Manually verify in the browser at `http://localhost:3000/reader`:
1. Wrong key → inline "Invalid access key" message, no stack trace.
2. `https://evilmedium.com/x` with right key → "Only medium.com URLs are allowed".
3. A real Medium URL → article renders (serif, ~680px, images rounded); find box highlights matches.
4. Library tab lists the saved article; search filters it; clicking re-opens it.
5. `logs/reader.log` contains `INFO read:` line with `reqId` matching the response's `X-Request-Id`; no key material anywhere in the file.

- [ ] **Step 5: Commit**

```bash
git add README.md .gitignore
git commit -m "docs(reader): document Reader's Corner setup, logging, and limitations"
```
