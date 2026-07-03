You are an expert Staff Frontend Engineer reviewing and fixing the ProdigyOS codebase at <path>/Samundar.

Fix ALL the following issues in order of priority. Be ruthless about quality.

## CRITICAL FIXES (Make the code production-grade)

### 1. Remove production console.log statements
- `src/proxy.ts:8` — Remove `console.log` in middleware (runs on EVERY request)
- `src/app/api/auth/[...nextauth]/route.ts` — Replace entire file with:
  ```ts
  export { GET, POST } from '@/auth';
  ```
  (No wrapper needed; the current one adds zero value.)
- `src/app/api/db/completions/route.ts:19` — Remove `console.log` that exposes MongoDB URI prefix
- `src/app/api/db/command-center/route.ts` — Remove any `console.log` statements

### 2. Fix the empty catch block
- `src/lib/activity-logger.ts:7` — Replace `catch {}` with:
  ```ts
  } catch (error) {
    console.error('[ActivityLogger] Failed to log activity:', error);
  }
  ```

### 3. Implement the /api/sync endpoint properly
- `src/app/api/sync/route.ts` — This is a stub that always returns `{ success: true }` without doing anything. Either:
  - Implement actual localStorage → MongoDB sync logic, OR
  - Return HTTP 501 with `{ error: 'Not Implemented' }` so callers know it's a stub

### 4. Fix the SpotlightCard dead code
- `src/components/ui/SpotlightCard.tsx` — The `position` (x, y) and `opacity` states are set on mouse events but NEVER used in the JSX. The spotlight gradient overlay is missing. Either:
  - Add the gradient overlay div that uses `position` and `opacity`:
    ```tsx
    <div
      className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
      style={{
        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        opacity,
      }}
    />
    ```
    Place this AFTER the children div but BEFORE the closing parent div.
  - OR remove all mouse tracking state and simply render the decorative border.

### 5. Fix BackgroundGradient to actually be a gradient
- `src/components/ui/background-gradient.tsx` — The `animate` prop is accepted but never used. The component renders a flat border, not a gradient. Either:
  - Implement the animated gradient effect that the name promises, OR
  - Rename the component to something honest like `BorderedCard` and remove the unused `animate` prop

## TYPE SAFETY FIXES

### 6. Remove `as any` from auth.config.ts
- `src/auth.config.ts:24,27,31` — Replace all `: any` annotations with proper NextAuth v5 types:
  ```ts
  import type { JWT } from 'next-auth/jwt';
  import type { Session, User } from 'next-auth';
  
  // In callbacks:
  jwt({ token, user }: { token: JWT; user?: User }) { ... }
  session({ session, token }: { session: Session; token: JWT }) { ... }
  ```

### 7. Remove `as any` from search API
- `src/app/api/search/route.ts:25,30,35,40` — Replace `as any[]` and `as [string, any][]` with proper typed interfaces matching your pattern data structure. Create a shared type if needed.

### 8. Remove `as any` from command-center API
- `src/app/api/db/command-center/route.ts:39,50,51,59,112,117` — Replace `as any` casts with proper mongoose document types.

## ARCHITECTURE FIXES

### 9. Extract shared roadmap data
- `src/app/(dashboard)/analytics/page.tsx:16-35` defines ROADMAPS array
- `src/app/(dashboard)/roadmaps/page.tsx:12-90` defines nearly identical categories array
- Create `src/data/roadmaps.ts` with a single source of truth:
  ```ts
  export interface Roadmap {
    slug: string;
    title: string;
    description: string;
    storageKey: string;
    total: number;
    category: string;
    color: string;
    href: string;
    hours: number;
    difficulty: string;
    topics: string[];
  }
  
  export const ROADMAPS: Roadmap[] = [...];
  ```
- Import from this file in both pages instead of duplicating.

### 10. Centralize localStorage keys
- Create `src/lib/storage-keys.ts` with all localStorage key constants:
  - `samundar-command-center-${email}`
  - `daily-completions`, `daily-notes`, `daily-schedule`
  - `foundation-os-completed`, `foundation-dbms-completed`, etc.
  - All pattern keys currently scattered across analytics, roadmaps, daily, problems table, and command-center
- Replace ALL inline string literals with imports from this file.

### 11. Extract hydration guard into a reusable hook
- Create `src/hooks/useMounted.ts`:
  ```ts
  import { useState, useEffect } from 'react';
  
  export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    return mounted;
  }
  ```
- Replace the `[mounted, setMounted]` pattern currently duplicated in every client page.

## PERFORMANCE FIXES

### 12. Optimize search API
- `src/app/api/search/route.ts` — Currently loads all patterns then loops through every problem. Add client-side indexing or pre-computed search data so every search doesn't iterate all 98+ problems.

### 13. Split the 1012-line daily page
- `src/app/(dashboard)/daily/page.tsx` — Split into:
  - `src/components/daily/PomodoroTimer.tsx`
  - `src/components/daily/TimeBlockGrid.tsx`
  - `src/components/daily/TaskList.tsx`
  - `src/components/daily/CustomTaskInput.tsx`
  - Keep only orchestration and layout in the page.

### 14. Split the 752-line ProblemsTable
- `src/components/patterns/ProblemsTable.tsx` — Extract:
  - AddProblemDialog
  - Row rendering logic
  - Pagination controls
  - Each into its own file.

## UI CONSISTENCY FIXES

### 15. Remove inline style from progress.tsx
- `src/components/ui/progress.tsx:21` — Replace inline `style={{ transform }}` with a CSS custom property or use Radix UI's built-in approach.

### 16. Fix magic numbers in daily page
- `src/app/(dashboard)/daily/page.tsx:184-191` — Replace numbers `360, 540, 720, 780, 960, 1080, 1140` with named constants or a time-block configuration array.

## PRODUCTION READINESS

### 17. Add error boundaries
- Create `src/components/shared/ErrorBoundary.tsx` with proper fallback UI
- Wrap route group layouts and individual page sections

### 18. Add tests for critical paths
- Auth flow (login, lockout, password reset) — at minimum
- Repository layer (static-repository.ts CRUD operations)
- Utility functions (utils.ts, computeStreak, computeProgress)
- At least 1 API route integration test

## CODE CLEANUP

### 19. Remove or implement dsa-tracker.json
- `samundar-data/dsa-tracker.json` at 401,955 lines for 98 problems is excessive
- Either compress it, split it, or move it to an API

### 20. Update AGENTS.md and CLAUDE.md
- Add actual project context, architecture decisions, and coding conventions
- Currently placeholder files with 5 and 1 lines respectively
