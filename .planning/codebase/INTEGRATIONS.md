# External Integrations

**Analysis Date:** 2026-07-18

## APIs & External Services

**Data / Problem Solving:**
- **LeetCode GraphQL API** — Fetches DSA problem descriptions by title slug
  - Endpoint: `https://leetcode.com/graphql`
  - Purpose: Displays problem descriptions in the UI when a user browses DSA patterns
  - Integration file: `src/app/api/leetcode/route.ts`
  - Auth: None (public GraphQL endpoint)
  - Caching: `next: { revalidate: 86400 }` (24h CDN cache via Next.js fetch)
  - API call: POST with GraphQL query `questionData($titleSlug)`, returns content, difficulty, topic tags

**LaTeX / PDF Compilation:**
- **Cloud LaTeX Compiler (ytotech)** — Fallback when local `pdflatex` is unavailable
  - Endpoint: `https://latex.ytotech.com/builds/sync`
  - Purpose: Compiles resume LaTeX source to PDF on Vercel (where `pdflatex` is not available)
  - Integration file: `src/app/api/latex/compile/route.ts`
  - Auth: None (public API)
  - Limits: 30s timeout, ~5MB document size limit, rate-limited (429)
  - Fallback logic: tries local `pdflatex` first, falls back to cloud on `ENOENT`

**Local LaTeX Compilation:**
- `pdflatex` binary spawned via `child_process.spawn()`
  - Purpose: Primary compilation path for resume PDFs
  - Works in local dev where LaTeX distribution is installed
  - Falls back to cloud compiler when binary not found (e.g., on Vercel serverless)

## Data Storage

**Databases:**
- **MongoDB** — Primary persistent storage
  - Provider: MongoDB Atlas (cloud, home mode); local MongoDB instance (office mode)
  - Connection strings:
    - `MONGODB_URI_HOME` — Atlas cluster (`mongodb+srv://...samundar?retryWrites=true&w=majority`)
    - `MONGODB_URI_OFFICE` — Local instance (`mongodb://localhost:27017/samundar`)
    - Fallback: `MONGODB_URI`
  - Client: Mongoose ^9.7.1 (`src/lib/db.ts`)
  - Connection caching: Global module-level cache with per-URI connection pooling (`global.mongooseCache`)
  - Mode switching: HOME/OFFICE modes via `app-mode` cookie and `mode-store` Zustand store
  - Models (all in `src/lib/models/`):
    - `Profile.ts` — User accounts (email, name, password hash, role, goals, resetPin, onboarding data)
    - `Completion.ts` — Task completion records (storagePrefix, itemId, completedAt)
    - `DailyRecord.ts` — Daily task tracking (date, userEmail, completedTaskIds, note)
    - `Activity.ts` — Activity log entries
    - `Note.ts` — User notes per topic
    - `Book.ts` — Book metadata with PDF paths
    - `CustomTopic.ts` — User-created learning topics
    - `CustomRoadmap.ts` — User-created learning roadmaps
    - `CustomQA.ts` — Custom QA book content (Java prep, etc.)
    - `CustomQAProgress.ts` — Progress tracking for custom QA books
    - `Highlight.ts` — User highlights from reading
    - `Revision.ts` — Spaced-revision scheduler items
    - `Resume.ts` — Resume metadata (title, company, latexSource, pdfData, version)
    - `LoginAttempt.ts` — Auth audit log (email, success, failReason, timestamp) — used for brute-force lockout
    - `Project.ts` — User projects data
    - `Application.ts` — Job application tracking
    - `InterviewRound.ts` — Interview round details
    - `Company.ts` — Company profiles for job search
    - `Onboarding.ts` — Onboarding wizard state

**File Storage:**
- Local filesystem only
  - Book PDF assets: `src/assets/Being-Backend-Prodigy/` (committed to repo)
  - Uploaded book PDFs: `public/` directory (served statically)
  - No cloud file storage (S3, etc.) integrated

**Caching:**
- TanStack Query client-side cache — Default staleTime=5min, gcTime=10min
- Next.js fetch cache — Used for LeetCode API (`revalidate: 86400`)
- localStorage — Client-side persistence for completion data, notes, schedule, mode preference, onboarding status

**Offline-First Pattern:**
- localStorage serves as the primary data layer in the client
- MongoDB sync happens on write via API routes
- Data flow: localStorage → API route → MongoDB
- On page load, UI reads from localStorage first, then fetches from API to reconcile

## Authentication & Identity

**Auth Provider:**
- **NextAuth v5 (next-auth@^5.0.0-beta.31)** with Credentials provider
  - Strategy: JWT-based sessions (no database sessions)
  - Config: `src/auth.config.ts` — sets JWT strategy, custom signIn/newUser pages, callbacks for token/session
  - Auth handler: `src/auth.ts` — full NextAuth setup with Credentials provider
    - Validates email + password against MongoDB `Profile` collection
    - Password verification via `bcrypt-ts` (cross-runtime compatible)
    - Brute-force lockout: 5 failed attempts in 15-minute window (via `LoginAttempt` model)
  - Middleware: `src/auth.middleware.ts` + `src/proxy.ts` —
    - Protects all non-API routes except `/login`, `/register`, `/reset`
    - Redirects unauthenticated users to `/login` with `callbackUrl`
    - Redirects authenticated users away from auth pages
  - Route: `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API handlers (GET/POST)
  - Registration endpoint: `src/app/api/auth/register/route.ts` — bcrypt hashing (cost=12), optional reset PIN

**Custom Auth Features:**
- Registration with optional reset PIN (bcrypt hashed, cost=10)
- Email change with password verification (`/api/profile/email`)
- Login streak tracking (`/api/auth/login-streak`)
- Password reset via `/api/auth/reset`
- Role-based: `role` field on Profile (default: "Software Engineer"), persisted in JWT token

## Monitoring & Observability

**Error Tracking:**
- None integrated — all errors are `console.error` in catch blocks throughout API routes

**Logs:**
- `console.log` / `console.warn` / `console.error` throughout server-side code
- No structured logging, external log aggregation, or observability platform

## CI/CD & Deployment

**Hosting:**
- **Vercel**
  - Config: `vercel.json` in project root
  - Cron job scheduled: `0 22 * * *` (daily at 22:00 UTC) hitting `/api/cron/daily-check?secret=@cron_secret`

**CI Pipeline:**
- Not detected — `.github/workflows/` directory exists but contains no workflow files

## Environment Configuration

**Required env vars:**
| Variable | Purpose | Where used |
|---|---|---|
| `AUTH_SECRET` | NextAuth JWT encryption | `src/auth.ts` |
| `MONGODB_URI_HOME` | MongoDB Atlas (home mode) | `src/lib/db.ts` |
| `MONGODB_URI_OFFICE` | Local MongoDB (office mode) | `src/lib/db.ts` |
| `MONGODB_URI` | Fallback MongoDB URI | `src/lib/db.ts` |
| `CRON_SECRET` | Vercel cron auth token | `src/app/api/cron/daily-check/route.ts` |
| `RESEND_API_KEY` | Resend email API key | `src/lib/email.ts` |
| `EMAIL_FROM` | Sender address (default: `noreply@prodigyos.app`) | `src/lib/email.ts` |
| `MONGODB_URI` (short) | Generic fallback | `src/lib/db.ts` |

**Secrets location:**
- `.env.local` — local development secrets (not committed — in `.gitignore`)
- Vercel Environment Variables (Production/Preview) — for deployed environments
- `@cron_secret` in `vercel.json` references Vercel environment variable

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (no outbound webhooks configured)

**Scheduled Jobs:**
- **Vercel Cron Job** — `/api/cron/daily-check` runs daily at 22:00 UTC
  - Purpose: Checks if user completed daily DSA/SD/Other tasks; sends reminder email via Resend if not
  - Authentication: `secret` query param matched against `CRON_SECRET` env var
  - Uses `sendEmail()` from `src/lib/email.ts` to send reminders to all registered users

## Email

**Provider:**
- **Resend** (`resend@^6.16.0`) — Transactional email service
  - SDK init: `new Resend(process.env.RESEND_API_KEY)` in `src/lib/email.ts`
  - Wrapped in `sendEmail({ to, subject, text })` helper that gracefully degrades if `RESEND_API_KEY` is not set
  - From address configurable via `EMAIL_FROM` env var (defaults to `noreply@prodigyos.app`)
  - Only used for cron-based daily reminder emails currently

---

*Integration audit: 2026-07-18*
