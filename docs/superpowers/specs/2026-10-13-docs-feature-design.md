# Docs Feature Design

Top-level `/docs` route: upload PDF/DOCX/MD, read, browse by user-defined category. Full feature parity with books where it applies.

## Decisions

- Placement: top-level `/docs` (own sidebar entry, not a books tab). Existing books "Documentation" articles tab untouched.
- Categories: user-defined free strings; combobox suggests existing categories.
- Formats: PDF (react-pdf, reused from books), DOCX (mammoth → HTML), MD (react-markdown).
- Storage: UploadThing only (`docUploader`, pdf/docx/md, 32MB). No Buffer-in-Mongo path.
- Per-user via `userEmail`; PUT/DELETE ownership-checked like books.

## Data

- `Doc`: `id (d-<ts>), title, category, status (TO_READ|READING|COMPLETED|REFERENCE), progress (0-100), fileUrl, fileType ('pdf'|'docx'|'md'), fileName, userEmail, timestamps`
- `DocContent`: `docId, title, category, content (≤50k chars), contentLength, indexedAt`; Mongo text index on title (w:10) + content (w:1)
- Highlights/bookmarks: reuse `Highlight`/`Bookmark` models and `/api/db/*` endpoints; `bookId` field carries the docId.

## API

- `GET/POST/PUT/DELETE /api/db/docs` — CRUD, auth + ownership
- `GET /api/docs/read/[id]` — 302 to `fileUrl`
- `GET /api/docs/search?q=` — `$text` on DocContent, limit 20, metadata only
- Text extraction at upload: pdf-parse / mammoth.extractRawText / raw md → upsert DocContent; failure non-fatal

## UI

- `/docs` (dashboard): header, search box, category sections from distinct user categories + All, card grid, empty state, Add Doc dialog
- `DocFormDialog`: title*, category combobox, status select, required file input (`.pdf,.docx,.md`), UploadThing upload, save
- Reader `(reader)/docs/[id]`: shared toolbar; PDF = existing pdf-viewer (pages, zoom, rect highlights, page bookmarks); DOCX = HTML pane; MD = markdown pane
- DOCX/MD highlights: selection → 6-color toolbar → store `{docId, text, color}`; rehydrate by text-node walk + `<mark>` wrap; click to delete
- DOCX/MD bookmarks: scroll fraction + note; jump = scrollTo fraction
- Progress: debounced % save on scroll/page change

## Hooks

`use-docs.ts` (`['docs', userEmail]`), `use-doc-search.ts` (`['doc-search', q]`) — TanStack Query, mirror books hooks.

## Verification

`npm run lint`, `npm run typecheck`; manual upload/read/highlight/bookmark/browse/search for each format.
