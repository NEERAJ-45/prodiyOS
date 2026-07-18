# Coding Conventions

**Analysis Date:** 2026-07-18

## Naming Patterns

**Files:**
- **kebab-case** for hooks: `use-completions.ts`, `use-daily.ts`, `use-custom-topics.ts`
- **kebab-case** for services: `completions.ts`, `custom-topics.ts`, `revision.ts`
- **kebab-case** for utility libs: `storage-keys.ts`, `activity-logger.ts`
- **PascalCase** for Mongoose models: `Completion.ts`, `DailyRecord.ts`, `Profile.ts`
- **kebab-case** for data files: `schedules.ts`, `roadmaps.ts`, `books.ts`
- **kebab-case** for UI components: `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`
- **PascalCase** for page components (directory-based in Next.js App Router): `page.tsx`, `layout.tsx`
- **camelCase** for configuration: `auth.config.ts`, `auth.middleware.ts`

**Functions:**
- **camelCase** always: `cn()`, `formatRelativeTime()`, `toggleMode()`, `setSidebarCollapsed()`
- Hooks named `use*` (PascalCase after `use`): `useMounted()`, `useCompletionsQuery()`, `useToggleCompletion()`
- Query hooks: `use<Resource>Query()` — e.g., `useCompletionsQuery()`, `useDailyQuery()`, `useRevisionsQuery()`
- Mutation hooks: `use<Toggle|Save|Delete|Add><Resource>()` — e.g., `useToggleCompletion()`, `useSaveNote()`, `useDeleteRevision()`
- Server actions: `createBook()` (camelCase)
- Service functions: `fetchCompletions()`, `toggleCompletion()`, `resetCompletions()` (camelCase)
- Helper functions in data files: `day()`, `getDaySchedule()`, `getScheduleDays()` (camelCase)

**Variables:**
- **camelCase** always: `mounted`, `userEmail`, `storagePrefix`, `completedTaskIds`
- **UPPER_SNAKE_CASE** for constants: `STORAGE_KEYS.DAILY_COMPLETIONS`, `SCHEDULE_MODE_KEY`
- React state uses `[state, setState]` destructuring: `[completed, setCompleted]`, `[mounted, setMounted]`

**Types:**
- **PascalCase** for interfaces: `CompletionRecord`, `FetchCompletionsResponse`, `Mode`, `ScheduleId`
- **PascalCase** for type aliases: `Mode = 'HOME' | 'OFFICE'`, `Priority = 'must' | 'should' | 'nice'`
- **I-prefix** for Mongoose document interfaces: `ICompletion`, `INote`, `IProfile` (extends `Document`)
- Response types suffixed with `Response`: `FetchCompletionsResponse`, `ToggleCompletionResponse`
- Request types suffixed with `Request`: `ToggleCompletionRequest`, `SaveNoteRequest`

**Exports:**
- **Named exports** preferred for hooks, components, service functions, and utilities: `export function cn()`, `export function useCompletionsQuery()`, `export const Button`
- **Default exports** used for Mongoose models: `export default mongoose.models.Completion || mongoose.model<ICompletion>('Completion', CompletionSchema)`
- **Default exports** used for Next.js pages: `export default function DailyPage()`

## Code Style

**Formatting:**
- TypeScript with `strict: true` in `tsconfig.json`
- No Prettier config detected — formatting may rely on ESLint or editor defaults

**Linting:**
- ESLint v9 with flat config (`eslint.config.mjs` at root)
- Uses `eslint-config-next` with `core-web-vitals` and `typescript` presets
- Custom rules (all set to `"warn"`):
  - `react-hooks/set-state-in-effect`
  - `react-hooks/exhaustive-deps`
  - `react-hooks/incompatible-library`
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/no-empty-object-type`
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`
- Run via: `npm run lint` (runs `eslint`)

**TypeScript:**
- Target: ES2017
- Module: ESNext with `bundler` resolution
- strict mode enabled
- `@/*` path alias maps to `./src/*`
- `next` TypeScript plugin enabled
- `allowJs: true` — mixed JS/TS allowed

## Import Organization

**Order:**
1. External library imports (react, next, next-auth, @tanstack/react-query, etc.)
2. Internal project imports with `@/` alias
3. CSS imports (`./globals.css`)

**Path Aliases:**
- `@/*` → `./src/*`

**Example:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useCallback } from 'react';
import { fetchCompletions, toggleCompletion } from '@/lib/services/completions';
import type { FetchCompletionsResponse } from '@/lib/services/completions';
```

## Error Handling

**Patterns:**
- **API routes** (`src/app/api/`): Try/catch wrapping the entire handler, returning `NextResponse.json({ error: message }, { status: 500 })` on failure
- **Error type narrowing**: `const message = error instanceof Error ? error.message : 'An error occurred'` used consistently across API routes and services
- **Service functions** (`src/lib/services/`): Throw `new Error()` with descriptive messages on non-ok responses; parse error body from JSON
- **Auth errors**: Throws `new Error('LOCKED')` for brute-force lockout, caught by NextAuth
- **Server actions**: Return `{ error: string }` objects (not thrown)
- **Database failures**: Graceful fallback with `{ dbConnected: false, data: [] }` — never crashes the page
- **Storage operations**: Try/catch around `localStorage.getItem`/`setItem` with empty catch blocks
- **Logging**: `console.error('[Component] error:', error)` pattern with prefixed context tags

**API route error handling example** (`src/app/api/db/completions/route.ts`):
```typescript
try {
  // ... handler logic
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  console.error('[API/completions] Connection error:', message);
  return NextResponse.json({ dbConnected: false, error: message }, { status: 500 });
}
```

**Service error handling example** (`src/lib/services/completions.ts`):
```typescript
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new Error(
    (body as { error?: string }).error ?? `fetchCompletions failed: ${res.status}`,
  );
}
```

## Logging

**Framework:** No dedicated logging library — uses `console.log`, `console.error`, `console.warn`

**Patterns:**
- API errors: `console.error('[API/completions] Connection error:', message)` — bracket prefixed with component name
- Activity logging: `console.log('[email] Sent successfully:', result)` — bracket prefixed
- Auth: `console.error('[Auth] ...')` pattern assumed

## Comments

**When to Comment:**
- File-level JSDoc block at top of service files explaining purpose and relationship to hooks (`src/lib/services/completions.ts`):
  ```typescript
  /**
   * lib/services/completions.ts
   *
   * Typed fetch wrappers for /api/db/completions.
   *
   * These functions are intentionally pure (no React hooks) so they can be
   * called from server components, service workers, or test files.
   *
   * TODO: migrate use-completions.ts to delegate to these functions.
   */
  ```
- Section divider comments: `// ---------------------------------------------------------------------------` used in service files
- JSDoc on public service functions with `@throws` annotation
- Inline comments for non-obvious logic (e.g., parsers, migrations)
- `TODO` comments mark pending migration work (7 found across services and hooks)

**JSDoc/TSDoc:**
- Used on exported service functions with `@throws` documentation
- Used on function parameters where types aren't self-documenting
- Not used on simple utility functions or React components

## Function Design

**Size:** Functions are generally small and focused (5-50 lines). Larger modules like `static-repository.ts` (333 lines) and `parsers.ts` (198 lines) contain multiple focused functions.

**Parameters:** Named object parameters preferred for functions with >3 params. See service functions:
```typescript
export async function toggleCompletion(
  payload: ToggleCompletionRequest,
  headers: Record<string, string>,
): Promise<ToggleCompletionResponse>
```

**Return Values:**
- React hooks return the TanStack Query result directly: `return useQuery<FetchCompletionsResponse>({...})`
- Service functions return typed response objects with `{ success, data, error }` pattern
- API routes return `NextResponse.json(...)` with consistent `{ error?, dbConnected?, data? }` shape
- Server actions return `{ error?: string; book?: ... }` shape

## Module Design

**Exports:** Named exports preferred. Default exports reserved for Next.js pages and Mongoose models.

**Barrel Files:** Not used. Each module is imported directly from its file path.

**Module Organization:**
- **Data layer**: `src/data/` — static data and configuration
- **Hooks layer**: `src/hooks/` — React hooks wrapping TanStack Query
- **Service layer**: `src/lib/services/` — pure fetch wrappers (no React)
- **Models**: `src/lib/models/` — Mongoose schemas
- **UI components**: `src/components/ui/` — generic reusable Radix-based components
- **Shared components**: `src/components/shared/` — app-specific reusable components
- **Feature components**: `src/components/<feature>/` — feature-specific components
- **Providers**: `src/components/providers/` — React context providers
- **API routes**: `src/app/api/` — Next.js App Router route handlers
- **Actions**: `src/lib/actions/` — Next.js Server Actions
- **Utilities**: `src/lib/` — utility functions (`utils.ts`, `db.ts`, `parsers.ts`, `email.ts`)

**Entry Points:**
- `src/app/page.tsx` redirects to `/command-center`
- `src/app/layout.tsx` wraps with SessionProvider → QueryProvider → ProfileProvider → Toaster

## Data Fetching Conventions

**TanStack Query patterns** (applied across all hooks):
- **`useQuery`** for data reads with `queryKey: ['resource', ...params]`
- **`useMutation`** for writes with `onSuccess` calling `queryClient.invalidateQueries(...)`
- **Enabled guard**: `enabled: !!userEmail` — queries don't fire until user is known
- **Stale times**: 2min for most resources, 5min default in QueryProvider, 1min for daily
- **Default options** in `src/components/providers/QueryProvider.tsx`: staleTime=5min, gcTime=10min, retry=1, refetchOnWindowFocus=false
- **Header generation**: Local `useRequestHeaders()`-style hooks with `useCallback` and `Record<string, string>` return type

## React Conventions

**Component Types:**
- Functional components with named exports
- `'use client'` directive for interactive components
- `React.forwardRef` for Radix UI primitives
- `displayName` set on forwarded components

**Styling:**
- Tailwind CSS v3 (class-based)
- `cn()` utility from `src/lib/utils.ts` combining `clsx` + `tailwind-merge`
- `cva()` from `class-variance-authority` for component variants (see `button.tsx`)
- No CSS modules or styled-components

**State Management:**
- **Local state**: `useState`, `useReducer` for component-level
- **Client state**: Zustand store (`src/lib/stores/mode-store.ts`) for mode/sidebar state
- **Server state**: TanStack Query for all API data
- **Persistence**: localStorage for offline-first with DB sync (two-tier storage)

## Testing Conventions

Test files follow `src/**/*.test.{ts,tsx}` pattern. See TESTING.md for complete details.

---

*Convention analysis: 2026-07-18*
