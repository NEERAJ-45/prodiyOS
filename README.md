# Samundar — an operating system for becoming a better engineer

**Samundar** (Hindi for *ocean*) is a personal engineering OS. It keeps everything
between “I want to get better” and “I got the offer” in one place — the plan, the
practice, the notes, the documents, the job hunt, and the proof of progress.

Most learning dashboards stop at a checklist. Samundar goes from your weekly
schedule down to the PDF you were reading, and shows you the trend line that
proves it is working.

---

## Why this exists

Engineering growth is scattered across a dozen tools: a roadmap in Notion, DSA
problems in a spreadsheet, revision dates in your head, PDFs in Downloads, job
applications in Gmail, and analytics nowhere. Every switch costs focus.

Samundar collapses that into one product with one source of truth:

- **Plan** the week, then execute today’s slots.
- **Learn** with structured roadmaps, patterns, and spaced revision.
- **Build** projects and keep every reference document beside them.
- **Prove** progress with analytics instead of vibes.
- **Move** into the career pipeline when you are ready.

## What makes it different

- **One workspace, not six tabs.** Learning, planning, documents, and career
  tracking share the same account and the same data layer.
- **Docs that behave like a real file manager.** Nested folders, drag-and-drop,
  multi-select, trash, search, ZIP export, and an in-app PDF reader with its own
  background-task panel — no more “open in a new tab and lose your place”.
- **A reader you actually study in.** PDFs open in a resizable dock beside your
  files, with page navigation, zoom, full-page expansion, and reading progress
  tracked like any other asset.
- **Built for real daily use.** Keyboard shortcuts, inline rename, optimistic
  updates, offline-friendly localStorage fallbacks, and a home/office database
  toggle for environments with different networks.

---

## The product

### Learn

| Area | What it does |
|---|---|
| **Patterns Library** | Browse and track DSA patterns instead of memorising isolated problems. |
| **Roadmaps** | 20+ structured tracks: OS, DBMS, CN, System Design, Backend, Frontend, DevOps, Databases, Aptitude. |
| **Mastery Tracker** | Per-topic confidence and completion, not just checkboxes. |
| **Focus Mode** | Timed deep-work sessions with a music player. |
| **Revision System** | Spaced repetition scheduling that tells you what to revisit today. |

### Build

| Area | What it does |
|---|---|
| **Projects** | Track builds, links, and status alongside your learning. |
| **Interview Prep** | Company profiles, rounds, and question tracking. |
| **Job Applications** | Kanban pipeline from applied to offer. |
| **Research Library** | A bookshelf with a built-in PDF reader. |
| **Docs** | The file manager and document workspace described below. |

### Plan

Daily Planner, Weekly Overview, Activity Log, Task Manager, Resume workspace,
and Study Plan — schedule-aware, with catch-up support for missed days.

### Insights & Career

Analytics dashboards turn completions, revisions, and daily activity into
trends. The Career Hub ties roadmaps, projects, and applications together.
Quick Notes and an E2EE chat round out the workspace.

---

## Docs: the file manager inside your learning OS

`/docs` is a Nautilus-style workspace built for study material, not generic
cloud storage.

- **Real folder trees.** Nested folders up to 32 levels, breadcrumbs, sidebar
  tree, and a places panel.
- **Any file.** PDFs, images, video, audio, DOCX, Markdown, CSV, and code files
  get a preview instead of a dead download link.
- **Chunked uploads.** Files up to 100 MB stream in 4 MB chunks with live
  progress, per-file cancellation, and server-side session cleanup.
- **A docked PDF reader.** Open a PDF without leaving the file manager: resizable
  panel, page navigation, zoom, and one-click expand to the full reader.
- **Background tasks panel.** Uploads, ZIP exports, and PDF loads appear in a
  live task panel with progress, elapsed time, and cancel — the file manager
  equivalent of a process manager.
- **Grid or list, search, sort.** Multi-select, range selection, inline rename,
  keyboard shortcuts (`Enter`, `F2`, `Delete`, `Ctrl/Cmd+A`, `Esc`).
- **Drag and drop.** Move files between folders, or drop files from your OS
  straight into the current folder.
- **Safe deletes.** Trash with restore, purge, and empty-trash flows — nothing
  disappears permanently by accident.
- **ZIP export.** Download a selection or a whole folder as one archive.
- **Durable storage.** Metadata in MongoDB, file bytes in GridFS, with a legacy
  inline-content path for older documents.

---

## Architecture

```text
Next.js App Router
├── UI          Tailwind CSS v4 + MUI (docs workspace) + Radix primitives
├── Data        TanStack Query v5 (reads + mutations with cache invalidation)
├── Auth        NextAuth v5 — Credentials, JWT sessions, brute-force lockout
├── API         Route handlers under src/app/api
├── Storage     MongoDB via Mongoose; GridFS for file bytes
└── Tests       Vitest + React Testing Library + jsdom
```

- **Dual database:** home Atlas cluster and office local MongoDB, switchable at
  runtime; pending local data can be synced.
- **Progressive persistence:** client state lives in React/Zustand/localStorage
  and syncs to MongoDB, so the app stays usable when the database is not.
- **Streaming downloads:** Range requests, ETags, and streamed GridFS reads for
  large files and PDF pagination.

### Docs request flow

```text
UI → /api/docs/upload/init → PUT chunks → /api/docs/upload/:id/complete
   → GridFS (docFiles) + Doc metadata in MongoDB
UI → /api/docs/read/:id → Range-aware GridFS stream → PDF.js
```

---

## Quick start

### Requirements

- Node.js 20+
- A MongoDB instance (Atlas or local)

### Environment

Create `.env.local`:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | NextAuth encryption key |
| `MONGODB_URI` | Default MongoDB URI |
| `MONGODB_URI_HOME` | Optional Atlas URI for home mode |
| `MONGODB_URI_OFFICE` | Optional local URI for office mode |

Optional reader settings:

```bash
export READER_KEY='choose-a-long-random-secret'
```

### Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run the full test suite |
| `npm run test:watch` | Tests in watch mode |

## Project structure

```text
src/
├── app/              # App Router pages + API routes
│   ├── (auth)/       # Login / register
│   ├── (dashboard)/  # Main product pages
│   ├── (reader)/     # Full-page readers and previews
│   └── api/          # Route handlers
├── components/       # UI, layout, feature components
│   ├── files/        # File manager, PDF dock, task panel
│   └── ui/           # Reusable primitives
├── data/             # Roadmaps, schedules, static content
├── hooks/            # TanStack Query + feature hooks
├── lib/              # DB, models, files, utilities
└── auth.ts           # NextAuth configuration
```

## CI/CD

Every push to `main` runs:

1. Lint
2. Type check
3. Tests
4. Production build

---

## Reader mode

A personal read-later mode at `/reader`.

- Paste a `medium.com` article URL with your access key; the server extracts and
  renders a clean, escaped reading view.
- Saved articles are searchable from the Library tab, with find-in-page.
- Set `READER_KEY` in the environment before running or deploying.

**Known limitations:** paywalled/member-only articles extract little (no bypass);
some images are missing (only `miro.medium.com` and `cdn-images-1.medium.com`
are allowlisted); Medium may rate-limit datacenter IPs; the server fetches the
article, so the network must allow `medium.com`.

## License

MIT

## Acknowledgements

Chat emoji are rendered with **Animated Noto Emoji** from the official Google
Fonts Emoji CDN ([project page](https://googlefonts.github.io/noto-emoji-animation/)),
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
