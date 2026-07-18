# Codebase Structure

**Analysis Date:** 2026-07-18

## Directory Layout

```
samundar/
├── src/                          # Application source code
│   ├── app/                      # Next.js App Router pages + API
│   │   ├── (auth)/               # Authentication pages (login, register)
│   │   ├── (dashboard)/          # Authenticated dashboard pages (18 route groups)
│   │   ├── api/                  # API route handlers (13 resource groups)
│   │   ├── globals.css           # Global styles (dark theme, Tailwind)
│   │   ├── layout.tsx            # Root layout (providers tree)
│   │   └── page.tsx              # Root page (redirects to /command-center)
│   ├── assets/                   # Static assets (PDF books organized by topic)
│   ├── auth.config.ts            # NextAuth config (providers, callbacks, pages)
│   ├── auth.ts                   # NextAuth instance (credentials, bcrypt, lockout)
│   ├── auth.middleware.ts        # Auth middleware (re-exports NextAuth with config)
│   ├── components/               # React components
│   │   ├── books/                # Book-related feature components
│   │   ├── checklist/            # Checklist feature components
│   │   ├── daily/                # Daily schedule feature components
│   │   ├── focus/                # Focus mode feature components
│   │   ├── interview/            # Interview prep feature components
│   │   ├── interviews/           # Job application tracking components
│   │   ├── layout/               # Layout components (sidebar, navbar, mobile-nav, mode-toggle)
│   │   ├── onboarding/           # Onboarding wizard components
│   │   ├── patterns/             # Design patterns feature components
│   │   ├── providers/            # Context providers (ProfileProvider, QueryProvider)
│   │   ├── roadmaps/             # Roadmap display components
│   │   ├── shared/               # Shared/reusable components (ErrorBoundary, NotesDialog, etc.)
│   │   └── ui/                   # Generic UI primitives (19 components)
│   ├── data/                     # Static data definitions
│   │   ├── __tests__/            # Tests for data modules
│   │   ├── books.ts              # Book catalogue entries (59 books)
│   │   ├── java-sample-questions.ts # Java interview questions
│   │   ├── onboarding.ts         # Onboarding flow config (steps, options, schedule gen)
│   │   ├── roadmaps.ts           # Roadmap definitions (27 roadmaps)
│   │   ├── schedules.ts          # Study schedule templates (5 schedules)
│   │   └── striver-sheet.ts      # DSA problem list (Striver's SDE sheet)
│   ├── hooks/                    # Custom React hooks (22 files)
│   │   ├── use-completions.ts    # TanStack Query hook for completions API
│   │   ├── use-daily.ts          # TanStack Query hook for daily API
│   │   ├── use-notes.ts          # TanStack Query hook for notes API
│   │   ├── use-books.ts          # TanStack Query hook for books API
│   │   ├── use-command-center.ts # TanStack Query hook for command center
│   │   ├── use-custom-topics.ts  # TanStack Query hook for custom topics
│   │   ├── use-custom-qa.ts      # TanStack Query hook for custom Q&A
│   │   ├── use-custom-roadmaps.ts# TanStack Query hook for custom roadmaps
│   │   ├── use-revision.ts       # TanStack Query hook for revision scheduler
│   │   ├── use-projects.ts       # TanStack Query hook for projects
│   │   ├── use-history.ts        # TanStack Query hook for history
│   │   ├── use-interviews.ts     # TanStack Query hook for interviews
│   │   ├── use-resumes.ts        # TanStack Query hook for resumes
│   │   ├── use-highlights.ts     # TanStack Query hook for highlights
│   │   ├── use-onboarding.ts     # TanStack Query hook for onboarding status
│   │   ├── use-login-streak.ts   # TanStack Query hook for login streak
│   │   ├── use-pomodoro.ts       # Pomodoro timer hook
│   │   ├── use-local-storage.ts  # Generic localStorage hook
│   │   ├── use-request-headers.ts# Request header builder (x-user-email, x-mongodb-url)
│   │   ├── use-table-sync.ts     # Table state sync hook
│   │   ├── useKeyboardShortcut.ts# Keyboard shortcut listener hook
│   │   └── useMounted.ts         # Mounted state check hook
│   ├── lib/                      # Core library code
│   │   ├── __tests__/            # Tests for lib modules
│   │   ├── actions/              # Server actions (books.ts — file uploads)
│   │   ├── activity-logger.ts    # Activity logging service (writes to MongoDB)
│   │   ├── db.ts                 # MongoDB connection manager (multi-URI with caching)
│   │   ├── email.ts              # Email service (Resend integration)
│   │   ├── models/               # Mongoose models (17 files)
│   │   ├── parsers.ts            # Text format parser (JSON/CSV/TXT for Q&A import)
│   │   ├── repository/           # KnowledgeRepository pattern (interface, factory, static impl)
│   │   ├── schemas/              # Zod validation schemas (interview.ts)
│   │   ├── services/             # Typed fetch wrappers (7 files)
│   │   ├── storage-keys.ts       # localStorage key constants
│   │   ├── stores/               # Zustand stores (mode-store.ts)
│   │   ├── types/                # TypeScript type definitions (knowledge.ts)
│   │   └── utils.ts              # Utility functions (cn, formatRelativeTime)
│   └── proxy.ts                  # Next.js middleware (auth protection + redirect)
├── public/                       # Static assets (SVGs, book PDFs)
├── samundar-data/                # Knowledge repository JSON data files
├── scripts/                      # Utility scripts (flush-activities, generate-dsa-tracker)
├── propmpt/                      # Prompt reference material
├── quotes.ts                     # Inspirational quotes data
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config (path alias @/ → ./src/)
├── tailwind.config.ts            # Tailwind CSS config (custom dark theme)
├── postcss.config.mjs            # PostCSS config
├── eslint.config.mjs             # ESLint flat config
├── vitest.config.ts              # Vitest test runner config
├── next.config.ts                # Next.js config
├── vercel.json                   # Vercel deployment config
└── .env.local                    # Environment variables (exists — contains MONGODB_URI, AUTH_SECRET, etc.)
```

## Directory Purposes

**`src/app/` — Next.js App Router:**
- Purpose: All pages, layouts, and API routes
- Contains: Route groups `(auth)` and `(dashboard)`, API route handlers, root layout
- Key files: `layout.tsx` (providers), `globals.css` (theme), `page.tsx` (redirect)

**`src/app/(auth)/` — Auth Pages:**
- Purpose: Login and registration pages
- Contains: `login/page.tsx`, `register/page.tsx` (both `'use client'`)
- Route: Unauthenticated users are redirected here by middleware

**`src/app/(dashboard)/` — Dashboard Pages (18 route groups):**
- Purpose: All authenticated application pages
- Contains:
  - `analytics/` — Learning analytics dashboard
  - `books/` — Book management (list, read, [slug], read/[id])
  - `career/` — Career goals and planning
  - `command-center/` — Main dashboard hub (activity, project progress, quick stats)
  - `daily/` — Daily schedule management
  - `focus/` — Focus mode / Pomodoro timer
  - `history/` — Learning history
  - `interview/` — Interview preparation
  - `interviews/` — Job application tracking (applications, companies, notes)
  - `mastery/` — Mastery tracking
  - `patterns/` — Design patterns reference
  - `plan/` — Learning plan (resume/[id])
  - `projects/` — Project management
  - `revision/` — Spaced revision scheduler
  - `roadmaps/` — Learning roadmaps (foundation, backend, frontend, devops, databases, etc.)
  - `sticky-notes/` — Sticky notes feature
  - `tasks/` — Task management
  - `weekly/` — Weekly overview
- Key file: `layout.tsx` (dashboard shell with Sidebar + Navbar)

**`src/app/api/` — API Route Handlers (13 groups):**
- Purpose: Server-side data handling
- Contains:
  - `auth/` — NextAuth handler, register, login-streak, reset
  - `db/` — Core data APIs (completions, notes, daily, activity, books, profiles, projects, etc.)
  - `books/` — Book CRUD and PDF upload
  - `companies/` — Company CRUD
  - `cron/` — Scheduled tasks (daily-check)
  - `interviews/` — Interview round CRUD
  - `latex/` — LaTeX compilation
  - `leetcode/` — LeetCode integration
  - `patterns/` — Design patterns data
  - `profile/` — Profile management (email update)
  - `rounds/` — Interview rounds CRUD
  - `search/` — Global search
  - `sync/` — Data sync endpoints
- Pattern: Each subdirectory has `route.ts` exporting HTTP method handlers

**`src/components/` — React Components:**
- Purpose: Reusable UI and feature-specific components
- Contains:
  - `ui/` — Generic primitives (Button, Card, Dialog, Tabs, etc.) — 19 files
  - `layout/` — App shell (Sidebar, Navbar, MobileNav, ModeToggle)
  - `shared/` — Shared components (ErrorBoundary, NotesDialog, GlobalSearch, PageTransition)
  - `providers/` — Context providers (ProfileProvider, QueryProvider)
  - Feature dirs — `books/`, `daily/`, `roadmaps/`, `focus/`, `interview/`, etc.
- Key files: `providers/ProfileProvider.tsx` (216 lines — auth context, boot animation, onboarding gate)

**`src/data/` — Static Data Definitions:**
- Purpose: Configuration and reference data used across the app
- Contains: Roadmap definitions, book catalogue, schedules, onboarding config, DSA sheet
- Key file: `roadmaps.ts` (263 lines — 27 roadmap entries with topics, hours, categories)

**`src/hooks/` — Custom React Hooks:**
- Purpose: Data fetching hooks using TanStack Query, plus utility hooks
- Contains: 22 hooks — each major API resource has dedicated hooks (query + mutation)
- Pattern: `use[Resource]Query` for reads, `use[Action]` for writes, auto-invalidation on mutation success

**`src/lib/` — Core Library:**
- Purpose: Shared utilities, database, models, services, types, and stores
- Contains:
  - `db.ts` — MongoDB connection with multi-URI support (HOME/OFFICE modes)
  - `models/` — 17 Mongoose schemas (Profile, Completion, Note, DailyRecord, Activity, Revision, etc.)
  - `services/` — 7 typed fetch wrapper files (completions, daily, notes, custom-topics, etc.)
  - `repository/` — KnowledgeRepository interface + static JSON-file implementation
  - `stores/` — Zustand store for mode toggle
  - `types/` — TypeScript types for knowledge domain
  - `schemas/` — Zod validation schemas
  - `utils.ts` — cn() tailwind-merge utility, formatRelativeTime
- Key file: `models/Profile.ts` (45 lines — user profile with onboarding data, password hashing)

**`src/assets/` — Static Assets:**
- Purpose: PDF books organized by category (7 directories under `Being-Backend-Prodigy/`)
- Contains: Foundations, Distributed Systems, Architecture, Performance, Deep Mastery, Meta Learning, Others/Java-Notes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout — provider stack (SessionProvider → QueryProvider → ProfileProvider)
- `src/app/page.tsx`: Root page — redirects to `/command-center`
- `src/app/(dashboard)/layout.tsx`: Dashboard shell — Sidebar + Navbar + MobileNav + PageTransition
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth API handler (re-exports from `src/auth.ts`)
- `src/proxy.ts`: Next.js middleware — auth redirect, route matching config

**Configuration:**
- `package.json`: Scripts (dev, build, typecheck, test, lint), all dependencies
- `tsconfig.json`: TypeScript config with `@/*` path alias mapping to `./src/*`
- `tailwind.config.ts`: Tailwind CSS v3 with custom dark theme HSL variables
- `vitest.config.ts`: Vitest configuration with jsdom environment
- `next.config.ts`: Next.js configuration
- `vercel.json`: Vercel deployment configuration
- `eslint.config.mjs`: ESLint flat config

**Core Logic:**
- `src/auth.ts`: NextAuth instance — Credentials provider, bcrypt password validation, brute-force lockout
- `src/lib/db.ts`: MongoDB connection manager — multi-URI support, global caching
- `src/lib/repository/static-repository.ts`: JSON-file-based data store for knowledge management
- `src/lib/activity-logger.ts`: Activity audit log — writes to MongoDB Activity collection
- `src/lib/services/completions.ts`: Typed fetch wrappers for completions API
- `src/lib/services/daily.ts`: Typed fetch wrappers for daily API
- `src/lib/parsers.ts`: Multi-format Q&A text parser (JSON/CSV/TXT auto-detection)
- `src/lib/stores/mode-store.ts`: Zustand store — HOME/OFFICE mode toggle with localStorage persistence

**Testing:**
- `src/lib/__tests__/`: Tests for `utils.ts` (utils.test.ts) and setup (setup.ts)
- `src/data/__tests__/`: Tests for data modules
- `src/lib/stores/__tests__/`: Tests for mode-store (mode-store.test.ts)
- `vitest.config.ts`: Test runner config

## Naming Conventions

**Files:**
- **React components**: PascalCase with kebab-case for multi-word — `Button.tsx`, `ProfileProvider.tsx`, `mode-toggle.tsx`, `use-completions.ts`, `quote-toast.tsx`
- **Page files**: `page.tsx` inside route directories
- **Layout files**: `layout.tsx` inside route groups
- **API route handler**: `route.ts` inside API subdirectories
- **Data files**: camelCase — `roadmaps.ts`, `onboarding.ts`, `storage-keys.ts`
- **Model files**: PascalCase — `Completion.ts`, `DailyRecord.ts`, `LoginAttempt.ts`
- **Hooks**: kebab-case with `use-` prefix — `use-completions.ts`, `use-daily.ts`
- **Service files**: camelCase — `completions.ts`, `custom-topics.ts`
- **Config files**: camelCase with dot extensions — `tailwind.config.ts`, `vitest.config.ts`

**Directories:**
- **Route groups**: Parenthesized for Next.js route groups — `(auth)`, `(dashboard)`
- **Component directories**: lowercase — `ui/`, `shared/`, `layout/`, `providers/`, `books/`
- **Library directories**: lowercase — `models/`, `services/`, `stores/`, `repository/`, `types/`, `actions/`
- **API subdirectories**: lowercase — `db/`, `auth/`, `books/`, `interviews/`

## Where to Add New Code

**New Feature Page:**
- Primary code: Create new route directory under `src/app/(dashboard)/[feature-name]/`
- Page component: `page.tsx` with `'use client'` directive
- Dashboard layout wrapper: Already provided by `(dashboard)/layout.tsx`
- Tests: Co-located in `__tests__/` subdirectory or in `src/lib/__tests__/`

**New Component:**
- Reusable UI primitive: Add to `src/components/ui/[component-name].tsx`
- Feature-specific component: Add to `src/components/[feature-name]/[component-name].tsx`
- Shared cross-feature component: Add to `src/components/shared/[component-name].tsx`
- Pattern: Use `cn()` from `@/lib/utils`, CVA for variants, forwardRef for Radix-based components

**New API Route:**
- Create subdirectory under `src/app/api/` with `route.ts`
- Export HTTP handler functions (GET, POST, PUT, DELETE)
- Use `auth()` for authentication, `connectToDatabase()` for MongoDB
- Import models as needed (models handle deduplication automatically)

**New Hook:**
- Add to `src/hooks/use-[resource-name].ts`
- Use TanStack Query patterns: `useQuery` for reads, `useMutation` for writes
- Query key convention: `['resource', ...params]`
- On mutation success, call `queryClient.invalidateQueries({ queryKey: ['resource'] })`

**New Service:**
- Add to `src/lib/services/[resource-name].ts`
- Export typed interfaces for request/response
- Export pure async functions using `fetch()` — throw on non-2xx response
- Functions should be hook-independent (no React imports)

**New Mongoose Model:**
- Add to `src/lib/models/[ModelName].ts`
- Export interface extending `Document`
- Export default using `mongoose.models.X || mongoose.model<IX>('X', XSchema)` pattern
- Add compound indexes for user-scoped queries

**New Static Data:**
- Add to `src/data/[name].ts`
- Export typed constants/interfaces
- Store localStorage keys in `src/lib/storage-keys.ts`

**New Utility:**
- Add to `src/lib/utils.ts` for general utilities
- Create new file in `src/lib/` for domain-specific utilities

## Special Directories

**`samundar-data/`:**
- Purpose: JSON data files for the StaticKnowledgeRepository
- Contains: nodes.json, mastery-records.json, revision-schedules.json, projects.json, etc.
- Generated: Yes (by the application and scripts)
- Committed: Yes (contains seed/development data)

**`public/uploads/books/`:**
- Purpose: Uploaded PDF book files
- Generated: Yes (user uploads via server action)
- Committed: No

**`src/assets/Being-Backend-Prodigy/`:**
- Purpose: Curated PDF book collection organized by learning path category
- Contains: ~59 books across 7 categories (Foundations, Distributed Systems, etc.)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning artifacts (documents, phases, audits)
- Contains: Milestone plans, codebase docs, phase directories
- Generated: Yes (by GSD workflow)
- Committed: Yes

**`scripts/`:**
- Purpose: Utility scripts for data management
- Contains: `flush-activities.mjs` (clear activity logs), `generate-dsa-tracker.mjs` (generate DSA problem tracker)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-07-18*
