# Reader's Corner — Design Spec

**Date:** 2026-09-30
**Status:** Approved (chat design approved by user; this is the written form)
**Scope:** New feature inside the Samundar Next.js app (App Router, TypeScript)

## 1. Goal

A personal "reader mode" page for Medium articles. The user pastes a Medium URL
plus an access key; the server fetches the page, extracts a clean version of the
article (title, text, images), and renders it as a readable page. Extracted
articles are saved to MongoDB so the user can search them later, and each
article view has a find-in-page highlight box.

## 2. Non-goals

- No paywall/login/bot-protection bypass — only content a logged-out reader can see.
- No generic URL fetcher: only `medium.com` and its subdomains are allowed.
- No integration into Samundar's main navigation (reachable at `/reader` directly).
- No changes to Samundar's existing `Article` feature (that model stores the
  user's own written articles with code files; Reader's Corner uses a new model).
- No offline support, no image proxying (the browser loads images directly).

## 3. Architecture Overview

```
/reader (client page)
   │  form: access key + Medium URL
   ▼
POST /api/reader/read        GET /api/reader/articles?q=
   │  key check (403)            │  key check (403)
   │  URL allowlist              │  MongoDB text/title search
   │  fetch (timeout + UA)       ▼
   │  readability → turndown   ReaderArticle model (unique url)
   │  custom markdown renderer
   ▼
{ title, html, saved: true }
```

All extraction/rendering logic lives in a pure module `src/lib/reader.ts` so it
is unit-testable without HTTP or DB.

## 4. Components

### 4.1 `src/lib/reader.ts` (pure logic, no I/O except optional fetch helper)

- `checkKey(submitted: string): boolean` — compares against
  `process.env.READER_KEY` using `crypto.timingSafeEqual` on SHA-256 digests of
  both values (fixed length, no length leak, no early return on length
  mismatch). Throws if `READER_KEY` is unset — call-time check so tests can set
  the env var first. Fail-fast at boot is provided by
  `assertReaderKeyConfigured()` called at module top-level of both reader API
  route modules (route modules load on server start/build).
- `isAllowedMediumUrl(raw: string): boolean` — parse with `new URL()` (throws →
  false); scheme must be `http:`/`https:`; hostname must equal `medium.com` or
  end with `.medium.com`. This rejects `evilmedium.com`,
  `medium.com.evil.com`, and credential-injection URLs.
- `renderMarkdown(md: string): string` — the custom line renderer:
  - lines starting with `#` → `<h2>` (escaped inner text)
  - lines matching `![alt](url)` → `<figure><img src alt loading lazy
    referrerpolicy></figure>`, only if `url` is `https:` and its hostname is in
    `IMAGE_HOSTS = new Set(['miro.medium.com', 'cdn-images-1.medium.com'])`;
    otherwise the image line is dropped (rendered as nothing, not as a link)
  - every other non-empty line → `<p>`
  - all text and alt text pass through an `escapeHtml()` (equivalent of
    `html.escape`); URLs go into attributes with quotes (attribute-safe
    escaping). No raw-HTML passthrough: an `<img onerror=...>` or `<script>`
    in the source markdown is rendered as escaped text.
- `extractToMarkdown(html: string): string | null` — `@mozilla/readability`
  on a `jsdom` document → `turndown` → markdown string; returns `null` when the
  extracted text is empty/too short (< 200 chars ≈ "nothing useful extracted").
- `fetchArticle(url: string)` — server-side `fetch` with 10 s timeout
  (`AbortSignal.timeout`) and a browser-like `User-Agent`; returns `null` on
  any error. Redirects are followed without re-validating the final host — the
  *requested* URL must pass the allowlist (accepted risk, §9).
- This module is **server-only** (imported by API routes and tests, never by
  client components) because it reads `READER_KEY` and runs jsdom.

### 4.2 `src/lib/models/ReaderArticle.ts`

New Mongoose model (follows `Article.ts` conventions):

| field       | type   | notes                          |
|-------------|--------|--------------------------------|
| `url`       | String | required, unique index         |
| `title`     | String | required                       |
| `html`      | String | rendered, already-escaped HTML |
| `searchText`| String | plain text for library search  |
| `source`    | String | always `medium` for now        |

`timestamps: true`. Upsert on `url` so re-reading refreshes the copy.

### 4.3 API routes

- `POST /api/reader/read` — body `{ key, url }`
  1. `checkKey(key)` fails → `403 { error: 'Invalid access key' }`.
  2. `isAllowedMediumUrl(url)` fails → `400 { error: 'Only medium.com URLs are allowed' }`
     (the page re-shows the form with this message).
  3. fetch + extract + render inside `try/catch`. Empty/failed extraction →
     `422 { error: "Couldn't extract it, likely paywalled or blocked" }`.
  4. Success → upsert `ReaderArticle`, return `{ title, html, url }`.
  - DB write is best-effort: if the DB is unavailable, still return the
    extracted article with `saved: false` (reading works even without DB).
- `GET /api/reader/articles` — requires `x-reader-key` header, `checkKey`
  fails → 403. Two modes:
  - `?q=` — search: matches `title` or `searchText` (case-insensitive regex,
    `q` regex-escaped; empty `q` = list all), sorted `updatedAt: -1`, capped
    at 50, projecting `url, title, updatedAt` only (no `html` in list mode).
  - `?url=` — fetch one saved article in full (including `html`).

Both routes connect via `connectToDatabase(getDbUri(request))` (honors the
`x-mongodb-url` custom-DB header, per `src/app/api/db/request.ts`) and return
JSON errors — never stack traces.

### 4.4 `src/hooks/use-reader.ts`

TanStack Query hooks following `use-articles.ts` conventions (ProfileProvider
for `customDbUrl`; key stored in `sessionStorage`, not in React state that
persists to logs):

- `useReadArticle()` — mutation → POST `/api/reader/read`.
- `useReaderArticlesQuery(q)` — query `['reader-articles', q]`, `enabled` only
  when a key exists in sessionStorage.
- Query keys: `['reader-articles', ...]`; invalidation after successful read.

### 4.5 `src/app/reader/page.tsx` (client component)

Three views on one page (tabs or conditional sections):

1. **Read** — access key (password input) + article URL + Read button. Errors
   (403/400/422) render as a friendly inline message; never a stack trace.
2. **Article view** — renders server-provided `html` (safe by construction:
   produced only by `renderMarkdown`) inside a styled container:
   max-width 680px, serif font, line-height 1.7, `img { max-width: 100%;
   border-radius: 8px }`, light/dark via `prefers-color-scheme` (inline
   `<style>` scoped to the page or Tailwind classes — Tailwind preferred to
   match the codebase). Plus a **find-in-article** box: input highlights
   matches with `<mark>` and next/prev buttons scroll between them
   (client-side text-node walk; must escape the query before building
   match logic — no `innerHTML` with user input).
3. **Library** — saved-article list with live search (debounced `q` →
   `useReaderArticlesQuery`), click re-opens the article by fetching its full
   record: `GET /api/reader/articles?url=...` returns one article's `html`,
   while `?q=` returns the list projection without `html`. Same key check
   for both modes.

The access key lives in `sessionStorage` only, is never logged, and is sent
only to `/api/reader/*` routes.

## 5. Data flow (happy path)

1. User opens `/reader`, enters key + URL, clicks Read.
2. Client POSTs `/api/reader/read`; server validates key (timing-safe) and URL.
3. Server fetches Medium HTML (10 s timeout, browser UA).
4. Readability extracts the article body → turndown → markdown.
5. `renderMarkdown` produces escaped HTML with allowlisted images only.
6. Article upserted to MongoDB; `{ title, html }` returned.
7. Client renders HTML in the article container; user can find-in-page or
   browse/search the Library.

## 6. Error handling

| Condition                         | Behaviour                                             |
|-----------------------------------|-------------------------------------------------------|
| `READER_KEY` missing at build/run | Route modules throw on import (fail fast)             |
| Wrong key                         | 403 + "Invalid access key"                            |
| Non-medium / malformed URL        | 400 + "Only medium.com URLs are allowed" + form       |
| Fetch timeout / network error     | 422 friendly "Couldn't extract it..." message         |
| Empty extraction (paywall)        | 422 friendly message                                  |
| DB unavailable                    | Article still returned, `saved: false`                |
| Any unexpected server error       | 500 `{ error: 'Something went wrong' }`, full details in logs only |

The client never displays raw server errors — only the friendly messages above.

## 6a. Logging (failure diagnosis in prod)

New module `src/lib/reader-log.ts` — `logReaderEvent(level, stage, message, meta)`:

- **Output, both sinks on every event:**
  1. **stdout/stderr** — single structured line
     `[2026-09-30T12:00:00.000Z] ERROR extract url=https://... reason=fetch_timeout`
     — this is the durable, queryable source on Vercel (dashboard → Logs).
  2. **File, best-effort** — same line appended to a log file; wrapped in
     try/catch so file failure can never break a request.
- **File location:** `READER_LOG_DIR` env var if set → `reader.log` inside it;
  else on Vercel (`process.env.VERCEL`) → `/tmp/reader.log` (only writable
  path; ephemeral per instance — acceptable because stdout is the durable
  copy); else locally → `./logs/reader.log` (gitignored, persistent).
- **Rotation:** size guard — if the file exceeds ~1 MB, rename to
  `reader.log.1` (replacing the old one) before continuing. Keeps a bounded
  history without a dependency.
- **Stages logged:** `key-check` (403 attempts — log that an attempt happened,
  **never the submitted key**), `url-allowlist` (400 + rejected URL),
  `fetch` (timeout/DNS/TLS/HTTP status + final URL), `extract`
  (readability produced nothing / too short, HTML length),
  `render` (dropped image host — debug level), `save` (DB upsert failed),
  `unexpected` (full error stack).
- **Redaction rules:** never log the access key, `x-reader-key` header, or
  `READER_KEY`; URLs, titles, timings, and error messages are safe to log.
- Every reader API response includes an `X-Request-Id` (short random id) that
  also appears in the log line, so a user-visible failure can be matched to
  its log entry.


## 7. Security requirements

- Timing-safe key comparison; key never written to logs, errors, or HTML.
- URL allowlist via `URL` parsing (no string prefix checks).
- All renderer output escaped; attributes quoted; no raw-HTML passthrough.
- Image URLs: https-only + hostname allowlist; server never fetches images.
- No route accepts an arbitrary URL for server-side fetch except `/api/reader/read`,
  which is key-gated and domain-restricted.
- Saved `html` is rendered with `dangerouslySetInnerHTML` **only** because it
  is exclusively produced by `renderMarkdown` (escape-on-output design);
  user-supplied strings (search query, key, URL) never reach HTML unescaped.

## 8. Testing

Vitest (existing setup, tests in `src/lib/__tests__/`):

- `reader.test.ts`:
  - `checkKey`: correct key true, wrong key false, `READER_KEY` unset throws.
  - `isAllowedMediumUrl`: accepts `https://medium.com/@x/post`,
    `https://blog.medium.com/p`, `http://foo.medium.com/a`; rejects
    `evilmedium.com`, `medium.com.evil.com`, `https://notmedium.com`,
    `ftp://medium.com/x`, `javascript:alert(1)`, garbage input.
  - `renderMarkdown` escaping: `<script>` in heading/paragraph/alt text comes
    out escaped; attribute injection via image URL/alt is neutralized.
  - Image allowlist: `miro.medium.com` and `cdn-images-1.medium.com` render
    `<img>` with `loading="lazy"` + `referrerpolicy="no-referrer"`; other
    hosts (`evil.com`, `http://miro.medium.com/x` non-https) are dropped.
  - Logger: `logReaderEvent` never throws when the file path is unwritable,
    and the written line never contains the submitted key.
- Route-level behavior (key→403, allowlist→400) tested by calling the route
  handlers directly with `Request` objects if practical; otherwise covered by
  pure-function tests plus manual smoke test.

Verification commands: `npm run typecheck`, `npm run lint`, `npm test`, then
manual smoke test with `npm run dev` (form renders, bad key → 403 message,
good key + real Medium URL → article).

## 9. Known limitations / accepted risks

- Medium may rate-limit or block datacenter IPs; extraction may return nothing.
- Paywalled member-only articles extract little or nothing (by design — no bypass).
- Only two image CDNs allowlisted; some inline images may be missing.
- Redirect targets are not re-validated after the initial allowlist check
  (accepted; Medium redirects stay on its own domains).
- Library is per-deployment (MongoDB), not tied to the Samundar user session —
  gated by the reader key instead.

## 10. Deliverables

- `src/lib/reader.ts`, `src/lib/reader-log.ts`, `src/lib/models/ReaderArticle.ts`
- `src/app/api/reader/read/route.ts`, `src/app/api/reader/articles/route.ts`
- `src/hooks/use-reader.ts`, `src/app/reader/page.tsx`
- `src/lib/__tests__/reader.test.ts`
- README section (append to existing `README.md` or `docs/`): what it is,
  `READER_KEY` env var, how to open `/reader`, where logs go (local
  `logs/reader.log`, Vercel dashboard Logs + `/tmp/reader.log`),
  `READER_LOG_DIR` override, limitations above.
- `.gitignore`: add `logs/`.
- New deps: `@mozilla/readability`, `turndown` (+ move `jsdom` from
  devDependencies to dependencies so serverless can use it).
