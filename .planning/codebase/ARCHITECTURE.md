<!-- refreshed: 2026-07-18 -->
# Architecture

**Analysis Date:** 2026-07-18

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                                │
│  (Next.js App Router — `src/app/(dashboard)/` + `src/app/(auth)/`)      │
├─────────────────┬──────────────────┬──────────────────┬──────────────────┤
│  Dashboard      │  Auth Pages      │  API Routes      │  Layout          │
│  Pages          │  (login,         │  (src/app/api/)  │  Components      │
│  (command-      │   register)      │   ┌─ auth/       │  (Sidebar,       │
│   center,       │                  │   ├─ db/         │   Navbar,        │
│   roadmaps,     │                  │   ├─ books/      │   MobileNav)     │
│   daily, etc.)  │                  │   ├─ interviews/ │                  │
│                 │                  │   └─ ...         │                  │
└────────┬────────┴─────────┬────────┴────────┬────────┴─────────┬────────┘
         │                  │                  │                   │
         ▼                  ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Hooks Layer                                      │
│  (src/hooks/ — TanStack React Query)                                     │
│  useCompletionsQuery, useDailyQuery, useNotesQuery, etc.                 │
│  useMutation for writes → auto-invalidateQueries on success              │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Service Layer                                       │
│  (src/lib/services/)                                                     │
│  Pure fetch wrappers — no React, no hooks                                │
│  completions.ts, daily.ts, notes.ts, custom-topics.ts, etc.              │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API / Route Handlers                               │
│  (src/app/api/ — Next.js App Router route handlers)                     │
│  Each file exports GET/POST/PUT/DELETE functions                         │
│  Calls connectToDatabase(), auth(), Mongoose models                      │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Data / Persistence Layer                               │
│  src/lib/db.ts          — MongoDB connection manager                     │
│  src/lib/models/        — Mongoose schemas (17 models)                   │
│  src/lib/repository/    — KnowledgeRepository interface + static impl    │
│  src/lib/storage-keys.ts — localStorage key constants                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | SessionProvider → QueryProvider → ProfileProvider → children | `src/app/layout.tsx` |
| Dashboard Layout | Sidebar + Navbar + MobileNav + PageTransition wrapper | `src/app/(dashboard)/layout.tsx` |
| ProfileProvider | Auth context, boot screen, onboarding gate, email update | `src/components/providers/ProfileProvider.tsx` |
| QueryProvider | TanStack QueryClient with default options (staleTime=5min, gcTime=10min) | `src/components/providers/QueryProvider.tsx` |
| Auth (NextAuth) | Credentials provider, JWT session, brute-force lockout (5 fails/15min) | `src/auth.ts`, `src/auth.config.ts` |
| Auth Middleware | Route protection — redirects unauthenticated to /login | `src/proxy.ts` |
| StaticRepository | JSON-file-based KnowledgeRepository (samundar-data/ directory) | `src/lib/repository/static-repository.ts` |
| API Routes | Each resource (completions, notes, daily, etc.) has its own route.ts | `src/app/api/db/*/route.ts` |
| Hooks | TanStack Query hooks per resource, share ProfileContext via useProfile() | `src/hooks/*.ts` |
| Services | Typed fetch wrappers, pure functions, throw on error | `src/lib/services/*.ts` |
| Data | Static data (roadmaps, schedules, books, onboarding config) | `src/data/*.ts` |
| UI Components | Radix-based primitives with CVA variants, cn() utility | `src/components/ui/*.tsx` |

## Pattern Overview

**Overall:** Next.js App Router full-stack application with hybrid localStorage-first / MongoDB sync architecture.

**Key Characteristics:**
- **Provider tree** at root: SessionProvider → QueryProvider → ProfileProvider
- **TanStack Query** for all server-state: hooks delegate to service functions, which call API routes
- **API route handlers** in `src/app/api/` — each resource has a dedicated route.ts file
- **Mongoose models** in `src/lib/models/` — compound indexes on (storagePrefix, itemId, userEmail)
- **Hybrid persistence**: MongoDB for server sync, localStorage for offline-first client state
- **Repository pattern** for knowledge-management domain (`src/lib/repository/`)
- **Server actions** for file uploads (`src/lib/actions/books.ts`)
- **Zustand** for UI state (mode-store: HOME/OFFICE toggle, sidebar collapse)

## Layers

**Presentation Layer:**
- Purpose: Renders UI, handles user interaction
- Location: `src/app/(dashboard)/` and `src/app/(auth)/`
- Contains: Page components, layout components, client components
- Depends on: Hooks (for data), UI components (for rendering), shared components
- Used by: Next.js router

**Hooks Layer:**
- Purpose: Bridge between UI and data — provides query/mutation hooks
- Location: `src/hooks/`
- Contains: TanStack Query hooks per resource (useCompletionsQuery, useDailyQuery, etc.)
- Depends on: Service functions, ProfileProvider context
- Used by: Page components, feature components

**Service Layer:**
- Purpose: Typed fetch wrappers for API calls — pure functions with no React dependency
- Location: `src/lib/services/`
- Contains: fetchCompletions(), toggleCompletion(), fetchDaily(), syncDaily(), saveNote(), etc.
- Depends on: Nothing (pure fetch functions)
- Used by: Hooks layer

**API / Route Handler Layer:**
- Purpose: Server-side request handling, business logic, database interaction
- Location: `src/app/api/`
- Contains: Route handlers (GET/POST/PUT/DELETE) for each resource
- Depends on: auth(), connectToDatabase(), Mongoose models, activity-logger
- Used by: Service layer (via fetch from client)

**Data / Persistence Layer:**
- Purpose: Database connection, schema definitions, data access
- Location: `src/lib/db.ts`, `src/lib/models/`, `src/lib/repository/`, `src/lib/storage-keys.ts`
- Contains: MongoDB connection manager, 17 Mongoose models, KnowledgeRepository interface/impl, localStorage key constants
- Depends on: Mongoose, environment variables for MONGODB_URI
- Used by: API route handlers, repository consumers

## Data Flow

### Primary Request Path (Completions Example)

1. User clicks a checkbox in a roadmap page (`src/app/(dashboard)/roadmaps/*/page.tsx`)
2. Hook calls `useToggleCompletion().mutate({ storagePrefix, itemId, completedAt })` (`src/hooks/use-completions.ts:36`)
3. Hook calls `toggleCompletion()` service function (`src/lib/services/completions.ts:89`) — pure fetch to `POST /api/db/completions`
4. API route handler receives request (`src/app/api/db/completions/route.ts:43`)
5. Route handler calls `auth()` to verify session, `connectToDatabase()` to get MongoDB connection
6. Route handler performs MongoDB `findOneAndUpdate` on Completion model (`route.ts:78`)
7. On success, hook's `onSuccess` callback calls `queryClient.invalidateQueries()` to refresh cache
8. React Query triggers automatic re-render of all components using `useCompletionsQuery()`

### Secondary Flow: Hybrid localStorage-first

1. Client components write to localStorage directly using storage key constants (`src/lib/storage-keys.ts`)
2. On connectivity, `useSyncDaily()` mutation pushes data to MongoDB via `PUT /api/db/daily`
3. On page load, `useDailyQuery()` reads from API, falls back to cached data if offline

### State Management

- **Server state:** TanStack Query (React Query) — cached, stale-managed, auto-refreshed
- **Auth state:** NextAuth session via SessionProvider
- **Profile state:** React Context (ProfileProvider) — wraps userEmail, userName, userRole
- **UI state:** Zustand store (useModeStore) — mode toggle, sidebar collapsed state
- **Local persistence:** localStorage for completions, notes, schedule — storage keys in `src/lib/storage-keys.ts`
- **MongoDB persistence:** Mongoose models for all tracked data (completions, notes, daily, activity, etc.)

## Key Abstractions

**KnowledgeRepository (src/lib/repository/interface.ts):**
- Purpose: Abstraction over knowledge management data (nodes, mastery, revisions, projects, sessions, analytics)
- Implementations: `StaticKnowledgeRepository` (`src/lib/repository/static-repository.ts`) — reads/writes JSON files from `samundar-data/` directory
- Pattern: Repository pattern with sync-log append mechanism
- Factory: `getRepository()` singleton in `src/lib/repository/factory.ts`

**Service Functions (src/lib/services/*.ts):**
- Purpose: Typed, pure fetch wrappers for API endpoints
- Examples: `src/lib/services/completions.ts`, `src/lib/services/daily.ts`, `src/lib/services/notes.ts`, `src/lib/services/custom-topics.ts`
- Pattern: Each file exports typed interfaces + async functions; functions throw on network/HTTP error
- Status: Migrating inline fetch calls from hooks to delegate to these service functions (TODO comments in code)

**Mongoose Models (src/lib/models/*.ts):**
- Purpose: Database schema definitions with TypeScript interfaces
- Pattern: Each model file exports an interface (ICompletion, INote, etc.) and default export registering the model
- All models use the pattern: `export default mongoose.models.X || mongoose.model<IX>('X', XSchema)`
- Compound indexes on `(storagePrefix, itemId, userEmail)` for data-per-user scoping

**UI Components (src/components/ui/*.tsx):**
- Purpose: Generic, reusable primitives built on Radix UI
- Pattern: CVA (class-variance-authority) for variants, cn() utility from tailwind-merge, forwardRef
- Examples: `Button`, `Card`, `Dialog`, `Select`, `Tabs`, `Tooltip`, `Badge`

## Entry Points

**Application Entry:**
- Location: `src/app/layout.tsx`
- Triggers: Any request to the Next.js app
- Responsibilities: Provider tree setup, global CSS import, metadata

**Auth Entry:**
- Location: `src/app/api/auth/[...nextauth]/route.ts` (re-exports from `src/auth.ts`)
- Triggers: Sign-in, session checks, callbacks
- Responsibilities: Credentials validation, JWT token management

**Dashboard Entry:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Any authenticated page request under dashboard routes
- Responsibilities: Sidebar, Navbar, MobileNav rendering, page transitions

**Middleware Entry:**
- Location: `src/proxy.ts`
- Triggers: Route matching (matcher excludes /api, /_next/static, /_next/image, /favicon.ico)
- Responsibilities: Auth redirect for unauthenticated users, redirect authenticated away from auth pages

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js). No worker threads used.
- **Global state:** 
  - `mongooseCache` global in `src/lib/db.ts` — caches MongoDB connections per URI to avoid reconnection
  - `repositoryInstance` module-level singleton in `src/lib/repository/factory.ts` — in-memory KnowledgeRepository cache
  - Zustand store (`src/lib/stores/mode-store.ts`) — browser-scoped, uses localStorage for persistence
- **Circular imports:** None detected — models are imported only in route handlers and service functions; hooks import services but not vice versa
- **Client vs Server:** Pages under `(dashboard)` and `(auth)` use `'use client'` directive. API routes are server-only. Layout `src/app/layout.tsx` is a server component wrapping client providers.

## Anti-Patterns

### Dual Fetch Pattern (hooks calling fetch directly AND service functions existing)

**What happens:** Several hooks (`src/hooks/use-completions.ts`, `src/hooks/use-daily.ts`) call `fetch` inline with `useQuery`/`useMutation`, while `src/lib/services/*.ts` files contain typed wrappers that were intended to replace these inline calls. The migration is incomplete — marked with `TODO: migrate use-*.ts to delegate to these functions`.

**Why it's wrong:** Duplicated fetch logic — changes need to be made in two places. Inline fetch calls lack the error handling, typing, and documentation that the service layer provides.

**Do this instead:** All hooks should call service functions (e.g., `fetchCompletions()` from `src/lib/services/completions.ts`) instead of inline `fetch()`. The service functions already exist and have better error handling.

### MongoDB Model Registration via Side-Effect Import

**What happens:** API route handlers import models via `import '@/lib/models/Completion'` as a side-effect import to ensure schema registration before use.

**Why it's wrong:** Side-effect imports can have subtle ordering issues and make the dependency graph unclear. The `mongoose.models.X || mongoose.model<IX>('X', XSchema)` pattern in model files partially mitigates this, but the side-effect imports remain necessary.

**Do this instead:** Import the model default export directly: `import Completion from '@/lib/models/Completion'` — the model file itself handles deduplication via the `mongoose.models.X || mongoose.model(...)` pattern.

## Error Handling

**Strategy:** Hybrid — API routes use try/catch with JSON error responses; hooks surface errors through TanStack Query's error state; service functions throw on non-2xx responses.

**Patterns:**
- API routes: `try { ... } catch (error: unknown) { const message = error instanceof Error ? error.message : 'An error occurred'; return NextResponse.json({ error: message }, { status: 500 }); }`
- Service functions: Check `res.ok`, parse error body, throw new Error with descriptive message
- React Query: Errors surfaced via `isError` state, consumed by components for error UI
- ErrorBoundary: `src/components/shared/ErrorBoundary.tsx` — class component with fallback UI

## Cross-Cutting Concerns

**Logging:** `console.error` in API routes and services. Activity logging via `src/lib/activity-logger.ts` — writes to MongoDB Activity collection for audit trail.

**Validation:** Zod schemas for interview-related form data (`src/lib/schemas/interview.ts`). Inline validation for other API payloads.

**Authentication:** NextAuth v5 with Credentials provider, JWT sessions. Middleware (`src/proxy.ts`) protects dashboard routes. API routes call `auth()` and check `session.user.email`. Brute-force protection via LoginAttempt model (5 fails in 15-min window locks the account).

---

*Architecture analysis: 2026-07-18*
