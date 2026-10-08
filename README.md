# ProdigyOS — Samundar

Full-stack learning progress tracker built with **Next.js 16**, **MongoDB**, and **Tailwind CSS v4**.

Track DSA problems, follow learning roadmaps, manage daily schedules, run spaced revision, and analyze your progress — all in one place.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth v5 (Credentials, JWT, brute-force lockout)
- **Database**: MongoDB via Mongoose (dual-URI: home Atlas + office local)
- **Styling**: Tailwind CSS v4
- **Data Fetching**: TanStack Query v5 (`useQuery`/`useMutation`)
- **State**: Zustand + localStorage with DB sync
- **Testing**: Vitest + React Testing Library + jsdom

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance (Atlas cluster or local)

### Environment

```bash
cp .env.local.example .env.local
```

Fill in your secrets:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | NextAuth encryption key |
| `MONGODB_URI_HOME` | Atlas cluster URI (home) |
| `MONGODB_URI_OFFICE` | Local MongoDB URI (office) |

### Install & Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript check |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |

## Project Structure

```
src/
├── app/             # App Router pages + API routes
│   ├── (auth)/      # Login, register
│   ├── (dashboard)/ # All main pages
│   └── api/         # API route handlers
├── components/      # React components
│   ├── ui/          # Reusable primitives (Radix-based)
│   ├── layout/      # Sidebar, navbar, mode toggle
│   ├── roadmaps/    # Roadmap-specific components
│   └── shared/      # ErrorBoundary, GlobalSearch, etc.
├── data/            # Static data (schedules, books, roadmaps)
├── hooks/           # Shared React hooks
├── lib/             # Utilities, models, stores, DB
│   ├── models/      # Mongoose schemas
│   ├── stores/      # Zustand stores
│   └── repository/  # Knowledge repository pattern
└── auth.config.ts   # NextAuth configuration
```

## Key Features

- **Daily Execution** — Schedule-aware today view with 4 study tracks (Steady, React, Java, DevOps). Check off M1/M2/Night slots, add notes, catch up on missed days.
- **Home/Office Toggle** — Switch between Atlas cluster (home) and local MongoDB (office) with one click. Sync button pushes pending local data.
- **Learning Roadmaps** — 20+ roadmaps across OS, DBMS, CN, System Design, Backend, Frontend, DevOps, Databases, Aptitude.
- **Revision Engine** — Spaced repetition with scheduling.
- **DSA Patterns** — Browse and track problem-solving patterns.
- **Analytics Dashboard** — Progress visualization with charts.
- **Interview Prep** — Job tracker with kanban pipeline, company profiles, interview rounds.
- **Bookshelf** — Built-in PDF reader for reference books.

## CI/CD

Push to `main` triggers the CI pipeline:

1. **Lint** — ESLint
2. **Type check** — `tsc --noEmit`
3. **Test** — Vitest
4. **Build** — `next build`

Configure secrets in GitHub repo → Settings → Secrets → Actions.

## License

MIT

## Acknowledgements

- Chat emoji are rendered with **Animated Noto Emoji** served from the official
  Google Fonts Emoji CDN ([project page](https://googlefonts.github.io/noto-emoji-animation/)).
  Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

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
