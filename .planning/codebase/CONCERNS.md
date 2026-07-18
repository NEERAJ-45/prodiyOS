# Codebase Concerns

**Analysis Date:** 2026-07-18

## Tech Debt

### Service Layer Migration (TODO Stubs)
- **Issue:** Seven service files in `src/lib/services/` exist as thin wrappers with TODO comments indicating they were created as part of a migration but the actual hooks still use inline `fetch()` calls. The services are not consumed anywhere.
- **Files:**
  - `src/lib/services/completions.ts` (line 12) — "TODO: migrate use-completions.ts to delegate to these functions"
  - `src/lib/services/notes.ts` (line 6) — "TODO: migrate use-notes.ts to delegate to these functions"
  - `src/lib/services/custom-topics.ts` (line 6) — "TODO: migrate use-custom-topics.ts to delegate to these functions"
  - `src/lib/services/daily.ts` (line 6) — "TODO: migrate use-daily.ts to delegate to these functions"
  - `src/lib/services/projects.ts` (line 6) — "TODO: migrate projects/page.tsx inline fetch calls to use these functions"
  - `src/lib/services/revision.ts` (line 6) — "TODO: migrate revision/page.tsx inline fetch calls to use these functions"
  - `src/lib/services/custom-roadmaps.ts` (no explicit TODO but same pattern — unused wrappers)
- **Impact:** Dead code that adds cognitive overhead. The intended refactoring (hooks → services delegation) is incomplete.
- **Fix approach:** Either delete the unused service files or finish the migration by having each hook delegate to its corresponding service.

### Duplicated `useRequestHeaders()` Implementation
- **Issue:** The `getHeaders()` builder function is defined in multiple locations with identical logic:
  - `src/hooks/use-completions.ts` (lines 7-17) — inline `useRequestHeaders()`
  - `src/hooks/use-command-center.ts` (lines 39-44) — inline `getHeaders()`
  - `src/hooks/use-table-sync.ts` (lines 65-72) — inline `getRequestHeaders()`
  - `src/hooks/use-request-headers.ts` — the canonical shared version
- Some hooks still define their own instead of importing from `use-request-headers.ts`.
- **Impact:** Inconsistent headers if one copy gets updated and others don't. Violates DRY.
- **Fix approach:** Remove inline `getHeaders` definitions from `use-completions.ts`, `use-command-center.ts`, and `use-table-sync.ts` and import `useRequestHeaders` from `use-request-headers.ts`.

### Duplicate `loadLocalData` / `saveLocalData` Utilities
- **Issue:** `src/hooks/use-table-sync.ts` (lines 17-29) defines `loadLocalData()` and `saveLocalData()` as standalone helpers. These duplicate what `use-local-storage.ts` already provides with `lsGet` / `lsSet`.
- **Impact:** Two parallel localStorage access patterns. Inconsistent error handling.
- **Fix approach:** Migrate `use-table-sync.ts` to use `lsGet` / `lsSet` from `use-local-storage.ts`.

### TypeScript `ignoreBuildErrors: true`
- **Issue:** `next.config.ts` (line 17) sets `typescript: { ignoreBuildErrors: true }`. This bypasses all TypeScript type checking during production builds.
- **Impact:** Type errors can silently accumulate, leading to runtime crashes that would have been caught at build time.
- **Fix approach:** Remove this flag and fix the underlying type errors, or set it to `false` and fix build issues.

### Extensive Use of `Record<string, unknown>` and `as unknown as`
- **Issue:** Many API route handlers and hooks use `Record<string, unknown>` and unsafe type casts (`as unknown as`) instead of proper Zod validation or typed interfaces:
  - `src/app/api/db/resumes/route.ts` (line 61) — `updateFields: Record<string, unknown>`
  - `src/hooks/use-interviews.ts` (lines 87, 107, 178, 228) — `Record<string, unknown>` for mutation payloads
  - `src/lib/parsers.ts` (lines 48, 51, 66) — `Record<string, unknown>` casts on parsed JSON
  - `src/components/shared/AddRoadmapDialog.tsx` (lines 39, 53, 54, 64) — `unknown[]` arrays and `Record<string, unknown>` casts
  - `src/hooks/use-command-center.ts` (line 57) — `icon: undefined as unknown as React.ElementType`
  - `src/app/api/db/resumes/pdf/[id]/route.ts` (line 28) — `pdfBytes as unknown as BodyInit`
- **Impact:** Type safety is compromised. Runtime errors from unexpected data shapes will not be caught at compile time.
- **Fix approach:** Introduce proper Zod schemas for all request/response payloads, or at minimum use strongly typed interfaces.

### `tsconfig.json` Includes `.next/` Build Artifacts
- **Issue:** `tsconfig.json` (lines 29-30) includes `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` in the compilation scope. These are generated build artifacts.
- **Impact:** Can cause inconsistent type resolution and confusion between source and generated types.
- **Fix approach:** Remove generated `.next/` paths from `include` array — they are auto-included by Next.js plugin.

### Unused `use-local-storage.ts` TODO
- **Issue:** `src/hooks/use-local-storage.ts` (line 17) has a TODO: "migrate QuestionsTable, ProblemsTable, daily, projects, revision" — this migration was never completed.
- **Impact:** Codebase has multiple patterns for localStorage access, some using the shared hook and some using ad-hoc `JSON.parse(localStorage.getItem(...))`.
- **Fix approach:** Complete the migration or remove the TODO.

### Repository Singleton Pattern — No Testability
- **Issue:** `src/lib/repository/factory.ts` uses a module-level singleton (`repositoryInstance`). The `StaticKnowledgeRepository` stores data in the filesystem via `samundar-data/` directory.
- **Impact:** Hard to unit test since the singleton persists state across tests. The filesystem-based approach is not suitable for serverless/Vercel deployments (ephemeral filesystem).
- **Fix approach:** Use dependency injection or allow the repository to be swapped via environment config.

## Known Bugs

### Error Recovery on DB Disconnect Sends Empty Reminder Emails
- **Issue:** `src/app/api/cron/daily-check/route.ts` fetches ALL profiles and sends daily reminder emails to every user when `todayRecord` is null or doesn't meet requirements. If the database is temporarily unreachable at the moment of checking, all users receive a spurious "Daily Report Not Submitted" email.
- **Trigger:** Cron job runs at 22:00 daily; if MongoDB is briefly disconnected, `connectToDatabase()` returns null, but the route continues to fetch profiles and send emails.
- **Workaround:** None; the serverless function has no circuit-breaker for DB flakiness.

### LeetCode GraphQL Response — Silently Returns `null` on Error
- **Issue:** `src/app/api/leetcode/route.ts` (lines 28, 33) swallows all fetch/JSON errors by returning `null`. The client component `ProblemDesc.tsx` displays "No description available" but the user never knows if it was a network error, rate limit, or invalid slug.
- **Impact:** Poor user experience — failures are silent with no retry mechanism.
- **Fix approach:** Return meaningful error status codes and messages; implement client-side retry.

### `getDaySchedule` Returns null for Unknown Day But Not Used
- **Issue:** `src/data/__tests__/schedules.test.ts` (line 45) tests `getDaySchedule returns null for unknown day`, but the function `getDaySchedule` in `src/data/schedules.ts` returns null silently. The callers may not handle null correctly.
- **Files:** `src/data/schedules.ts` (lines 123, 130, 202) — returns null for various missing schedule cases.
- **Impact:** Potential runtime crashes in consuming components that assume a schedule object is always returned.

### Activity Logger — Fire-and-Forget with No Error Return
- **Issue:** `src/lib/activity-logger.ts` creates an Activity document with `await Activity.create(...)`, but the function signature is `async function logActivity(...)` and it's called with `await` everywhere. However, the catch block only `console.error`s the error — no caller knows if logging failed.
- **Impact:** Silent data loss of activity history. The analytics dashboard may show incomplete data without users knowing.
- **Fix approach:** Return success/failure status from `logActivity()`.

## Security Considerations

### Auth Middleware Doesn't Protect Most API Routes
- **Issue:** `src/proxy.ts` (line 31) has `matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']` — API routes are explicitly excluded from middleware authentication. Instead, individual API routes call `auth()` internally.
- **Risk:** If any new API route is added without the `auth()` check, it will be publicly accessible. Missing api/auth/`matcher` protection means every API handler must independently verify the session. A single omission = open endpoint.
- **Files:** `src/proxy.ts`, `src/app/api/db/` (many routes), `src/app/api/leetcode/route.ts`, `src/app/api/search/route.ts`
- **Current mitigation:** Each handler that needs auth calls `auth()` (e.g., `src/app/api/db/completions/route.ts` line 22), but this is inconsistent. Some routes like `src/app/api/search/route.ts` have no auth check at all.
- **Recommendations:** Include `/api` in the middleware matcher or create an API-specific middleware. Audit all API routes for missing auth checks.

### Resume API Accepts `x-user-email` Header as Sole Auth
- **Issue:** Several resume API handlers (e.g., `src/app/api/db/resumes/route.ts` lines 20, 50) accept `userEmail` from `request.headers.get('x-user-email')` as a fallback, without verifying the session. A client could spoof the header and access another user's resumes.
- **Files:** `src/app/api/db/resumes/route.ts`, `src/app/api/db/resumes/pdf/[id]/route.ts`
- **Current mitigation:** Some endpoints also check via `auth()` (like completions), but resume endpoints only use the header.
- **Recommendations:** Always verify `auth()` session server-side; do not trust client-provided email headers.

### CRON Secret as Empty String Fallback
- **Issue:** `src/app/api/cron/daily-check/route.ts` (line 9): `const CRON_SECRET = process.env.CRON_SECRET || '';` If `CRON_SECRET` env var is not set, the cron endpoint becomes accessible with an empty secret.
- **Impact:** Anyone can trigger daily-check emails by calling `/api/cron/daily-check?secret=` with an empty secret parameter.
- **Fix approach:** Throw/return 503 if `CRON_SECRET` is not configured, rather than defaulting to empty string.

### Resend API Key Initialized with Placeholder
- **Issue:** `src/lib/email.ts` (line 3): `const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');` — the SDK client is initialized with a placeholder string if the env var is missing, which would send invalid API calls.
- **Impact:** Silent failure mode — the email will fail but it costs a network call first.
- **Fix approach:** Lazy-initialize the Resend client only when `RESEND_API_KEY` is present.

### Reset PIN Stored In-Application
- **Issue:** The password reset mechanism (`src/app/api/auth/reset/route.ts`) uses a reset PIN stored as a bcrypt hash on the Profile document. This is an in-application reset flow with no email-based token — anyone who knows or guesses the email can trigger a reset if a PIN is configured.
- **Impact:** Weak password reset security compared to email-based OTP/reset-link flows.
- **Recommendations:** Add email-based OTP delivery via Resend as an additional verification step.

### `dangerouslySetInnerHTML` on Trusted but Unvalidated Content
- **Issue:** `src/components/patterns/ProblemDesc.tsx` (line 80) renders LeetCode HTML content using `dangerouslySetInnerHTML`. The content comes from LeetCode's GraphQL API and is not sanitized.
- **Impact:** If LeetCode's API is compromised or returns malicious HTML, the user's session is at risk of XSS.
- **Fix approach:** Sanitize HTML content with DOMPurify or similar before rendering.

## Performance Bottlenecks

### Large Page Components Without Code-Splitting
- **Issue:** Several dashboard pages are single large files with 400-750+ lines:
  - `src/app/(dashboard)/patterns/page.tsx` — 758 lines
  - `src/app/(dashboard)/projects/page.tsx` — 729 lines
  - `src/app/(dashboard)/analytics/page.tsx` — 625 lines
  - `src/app/(dashboard)/books/page.tsx` — 610 lines
  - `src/app/(dashboard)/revision/page.tsx` — 503 lines
  - `src/components/interview/CustomQAViewer.tsx` — 1032 lines
  - `src/components/focus/pomodoro-focus.tsx` — 692 lines
  - `src/components/onboarding/OnboardingWizard.tsx` — 511 lines
- **Impact:** Large client bundles increase initial load time. Poor code splitting means more JS parsed on first visit.
- **Improvement path:** Break large components into smaller sub-components with `React.lazy()` / dynamic imports for heavy sections.

### Inefficient Graph Queries in `use-table-sync.ts`
- **Issue:** `src/hooks/use-table-sync.ts` (lines 119-199) fires three sequential API calls on mount (`/api/db/completions`, `/api/db/notes`, `/api/db/custom-topics`) for every page that uses it. Each call is awaited sequentially.
- **Impact:** Pages using this hook (most DSA/roadmap pages) block rendering until all three network requests complete. This multiplies page load time by 3x serial fetch latency.
- **Improvement path:** Fire all three fetches in parallel with `Promise.allSettled()`, or batch them into a single API endpoint.

### Full Profile Collection Scan on Cron Job
- **Issue:** `src/app/api/cron/daily-check/route.ts` (line 41) loads ALL profiles from MongoDB (`Profile.find({}).lean()`) to send reminder emails. As user count grows, this becomes an O(n) operation reading every document.
- **Impact:** With hundreds of users, this will increasingly strain MongoDB IO during the cron window.
- **Improvement path:** Add pagination or batch processing, or only query users who have not submitted a daily report (join/filter).

### `samundar-data/` Filesystem Repository is Not Production-Ready
- **Issue:** `src/lib/repository/static-repository.ts` reads/writes JSON files to the `samundar-data/` directory in the project root. This is incompatible with serverless platforms (Vercel) where the filesystem is ephemeral and read-only after build.
- **Impact:** All features using this repository (KnowledgeGraph, analytics, missions, etc.) will fail silently or lose data when deployed.
- **Improvement path:** Either implement a MongoDB-backed repository or ensure MongoDB sync is the primary data path.

## Fragile Areas

### `use-table-sync.ts` — Complex State with Side Effects
- **Files:** `src/hooks/use-table-sync.ts` (308 lines)
- **Why fragile:** Manages three separate localStorage keys, three React Query mutations, and a tri-source sync (localStorage → MongoDB → merged state). The `useEffect` dependency array (line 200) has 9 entries. The sync logic uses fire-and-forget `fetch()` calls inside the effect (lines 136-143) with `.catch(() => {})` that swallow errors. The `synced` ref prevents re-sync on remount but there's no mechanism to re-sync on connectivity changes or after manual data reset.
- **Safe modification:** Add comprehensive error handling for network failures. Use `useMutation` results instead of raw `fetch()`. Consider using a Zustand store for the sync state machine.
- **Test coverage:** No tests exist for this hook despite it being central to data integrity across all roadmap pages.

### Auth Credentials Provider — Brute Force Lockout Coupled to Login Flow
- **Files:** `src/auth.ts` (lines 25-33)
- **Why fragile:** The 5-failure/15-minute brute force lockout is implemented in the `authorize` callback, but it creates a `LoginAttempt` document on every attempt. If the `LoginAttempt` collection grows large or lacks proper indexes, lockout checks could slow down. There's no user notification when locked out — the thrown `Error('LOCKED')` is caught by NextAuth internally and surfaces as a generic "CredentialsSignin" error on the client.
- **Safe modification:** Add lockout state information to the login page UI. Ensure the TTL index on `LoginAttempt` (`src/lib/models/LoginAttempt.ts` line 20) is created in production.

### `ProfileProvider.tsx` — Boot Animation Coupled to Auth Loading
- **Files:** `src/components/providers/ProfileProvider.tsx` (216 lines)
- **Why fragile:** The boot animation (`BootScreen`) renders before the session is loaded, with hardcoded delays (420ms per log line, 600ms after completion). If session loading takes longer than expected, the user sees a blank/loading state after the boot screen. The component uses `lazy()` for `OnboardingWizard` but the boot screen itself is not lazy-loaded.
- **Safe modification:** Use `useSession` status to gate the boot screen transition rather than timer-based delays.

### PDF File Storage in MongoDB
- **Files:** `src/lib/models/Resume.ts` — stores `pdfData: Buffer` directly in MongoDB documents
- **Why fragile:** MongoDB has a 16MB document size limit. Large PDF files (especially with images) could exceed this. All resume queries that don't explicitly exclude `pdfData` (like the list endpoint at `src/app/api/db/resumes/route.ts` line 31 does with `.select('-pdfData')`) will transfer large amounts of data.
- **Safe modification:** Store PDFs in object storage (S3, GCS, or Vercel Blob) and keep only a URL reference in MongoDB.

## Scaling Limits

### MongoDB Connection Cache — Memory Leak Potential
- **Files:** `src/lib/db.ts` (lines 7-9) — uses a global `MongooseCache` object keyed by URI string
- **Current capacity:** Single serverless function instances with connection reuse
- **Limit:** Each unique `customUri` (from `x-mongodb-url` header) creates a separate connection pool stored in `connectionsCache`. If attackers send many unique URIs, this can exhaust memory or DB connections.
- **Scaling path:** Implement a maximum cache size or reject custom URIs after a limit. Currently used by multi-database feature in ProfileProvider.

### Custom MongoDB URL in Headers — No Validation
- **Issue:** The `x-mongodb-url` header (accepted in most API routes) allows clients to specify an arbitrary MongoDB connection string. `src/hooks/use-request-headers.ts` (line 26) sends `x-mongodb-url` from `customDbUrl` which comes from the user's profile (`mongodbUrl` field in Profile).
- **Impact:** A compromised admin account or stored XSS could redirect database queries to an attacker-controlled MongoDB server, exfiltrating all data.
- **Fix approach:** Validate custom MongoDB URLs against an allowlist or remove the custom DB URL feature entirely if it's unused in production.

## Dependencies at Risk

### `next-auth` — Beta Version on v5
- **Package:** `next-auth` ^5.0.0-beta.31 (package.json line 46)
- **Risk:** Beta software with potential breaking changes and possible security vulnerabilities. The API surface may change between beta releases.
- **Impact:** Any upgrade could require migration effort. Security patches may not be backported to beta.
- **Migration plan:** Monitor the `next-auth` v5 stable release. Until then, pin to exact version and test thoroughly before upgrading.

### `bcrypt-ts` — Relatively Niche Package
- **Package:** `bcrypt-ts` ^8.0.1 (package.json line 35)
- **Risk:** `bcrypt-ts` is a TypeScript-native bcrypt implementation. It may lack the battle-tested hardening of `bcrypt` (native C++) or `bcryptjs` (pure JS). Edge runtime compatibility is the tradeoff.
- **Impact:** Potential functional gaps or performance issues under load (hash cost factor 12 on the register route).
- **Migration plan:** Keep under review; test password hashing performance with cost factor 12. Consider downgrading cost factor for register route.

## Missing Critical Features

### No Request Rate Limiting
- **Problem:** None of the API routes implement rate limiting. Auth endpoints (login, register, reset) are particularly exposed to brute-force attacks. The brute-force lockout in auth.ts (5 attempts/15min) is only on the login `authorize` callback — the register and reset endpoints have no rate limiting.
- **Files:** `src/app/api/auth/login/`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/reset/route.ts`
- **Blocks:** Preventing credential stuffing and account enumeration attacks.

### No Input Validation Library (Zod Not Used in API Routes)
- **Problem:** While `zod` is in `package.json` and used in `src/lib/schemas/interview.ts`, the vast majority of API routes parse request bodies with manual `if (!body.field)` checks or raw `as unknown` casts. There is no centralized request validation.
- **Blocks:** Consistent, type-safe error messages. API contract enforcement between frontend hooks and backend routes.

## Test Coverage Gaps

### Near-Zero Test Coverage
- **What's not tested:** Only 3 test files exist:
  - `src/lib/__tests__/utils.test.ts` — 24 lines, tests only `cn()` utility
  - `src/lib/stores/__tests__/mode-store.test.ts` — tests Zustand mode store
  - `src/data/__tests__/schedules.test.ts` — tests schedule data functions
- **Untested critical areas:**
  - All hooks in `src/hooks/` (22 files) — zero tests
  - All API routes in `src/app/api/` (30+ route files) — zero tests
  - Auth flow (`src/auth.ts`, `src/auth.config.ts`) — zero tests
  - All service wrappers (`src/lib/services/`) — zero tests
  - MongoDB connection logic (`src/lib/db.ts`) — zero tests
  - All Mongoose models (`src/lib/models/`) — zero tests
  - All UI components — zero tests
- **Files:** `src/hooks/*.ts`, `src/app/api/**/route.ts`, `src/auth.ts`, `src/lib/db.ts`, `src/lib/services/*.ts`
- **Risk:** Any change to shared logic (data flow, auth, database connectivity) has no safety net. Regressions go undetected until production.
- **Priority:** High

### LocalStorage-Dependent Code Untestable
- **Problem:** Components and hooks that directly access `localStorage` (e.g., `use-table-sync.ts`, `use-local-storage.ts`, QuestionTable, ProblemsTable) are difficult to test because they have implicit browser dependencies. The `loadLocalData` function in `use-table-sync.ts` (line 17-26) returns fallback values on `typeof window === 'undefined'`, which means SSR tests may not exercise the real code path.
- **Priority:** Medium

---

*Concerns audit: 2026-07-18*
