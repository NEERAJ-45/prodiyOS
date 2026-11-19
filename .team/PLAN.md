# Phase 1 — Critical Containment PLAN

**Project:** ProdigyOS / Samundar (Next.js 16, MongoDB, NextAuth v5, Vitest)
**Goal:** Close critical security/abuse findings from the scalability review before any scale work.
**Branches:** `fix/phase-1-dev1` (worktree `../Samundar-dev1`), `fix/phase-1-dev2` (worktree `../Samundar-dev2`)
**Base commit:** `fd53b0d`

## Product decisions (locked)

| ID | Decision |
|----|----------|
| D1 | **Remove** client-supplied MongoDB URLs (BYO-DB disabled). `getDbUri` always returns `undefined`. `connectToDatabase` ignores any `customUri` argument. |
| D2 | Keep `POST /api/sync`; require session auth. |
| D3 | Keep LaTeX compile route; require session auth; **cloud-only** (delete local `pdflatex` spawn). |
| D4 | Cron emails only when day's completed task count is 0 (global DailyRecord limitation). |
| D5 | ATS atomic quota is **Phase 2** — out of scope here. |

## Spec (testable acceptance criteria)

### AC-1 SSRF / client DB URI (S1)
- `getDbUri(request)` returns `undefined` for absent header, arbitrary host, and internal hostnames.
- `connectToDatabase(customUri)` never calls `mongoose.createConnection` on request-derived strings; uses only `resolveMongoUri` from env/cookie mode.
- Client hooks no longer send `x-mongodb-url`.

### AC-2 /api/sync auth (S2)
- Unauthenticated `POST /api/sync` → HTTP 401.
- Authenticated → 200 with collection names (behavior otherwise unchanged).

### AC-3 LaTeX compile (S3)
- Unauthenticated `POST /api/latex/compile` → HTTP 401.
- Route contains no `child_process.spawn` / local `pdflatex`.
- Authenticated requests use cloud compiler only (existing `compileViaCloud`).

### AC-4 Cron hardening (S4)
- Missing `CRON_SECRET` env → always 403.
- No secret provided → 403.
- Valid `Authorization: Bearer <secret>` → proceeds.
- Deprecated `?secret=<valid>` still accepted (compat).
- Profile load uses `.select('email').lean()`.
- Email send uses bounded concurrency (chunk size 20), not unbounded `Promise.all`.
- `email.ts` does not log full Resend response objects.

### AC-5 Mongo pool (A1)
- `MONGO_CONNECT_OPTIONS` exported with `maxPoolSize: 10`, `bufferCommands: false`, existing timeouts preserved.
- Both connect paths use these options.

### AC-6 Reader logging (ST1)
- `logReaderEvent` performs no `*Sync` filesystem APIs.
- Console sinks still work; file sink is async fire-and-forget.

## Work packages (no file overlap)

### Dev-1 owns
- `src/app/api/db/request.ts`
- `src/lib/db.ts`
- `src/lib/reader-log.ts`
- `src/lib/__tests__/db-uri.test.ts` (create)
- `src/lib/__tests__/db-pool.test.ts` (create)
- `src/lib/__tests__/reader-log.test.ts` (modify)
- `src/hooks/use-request-headers.ts`
- `src/hooks/use-completions.ts`
- `src/components/providers/ProfileProvider.tsx` (only customDbUrl surface)
- Any other `src/hooks/use-*.ts` that still send `x-mongodb-url` (grep and fix headers only)

### Dev-2 owns
- `src/app/api/sync/route.ts`
- `src/app/api/latex/compile/route.ts`
- `src/app/api/cron/daily-check/route.ts`
- `src/lib/email.ts`
- `src/app/api/__tests__/sync.test.ts` (create)
- `src/app/api/__tests__/latex-compile.test.ts` (create)
- `src/app/api/__tests__/cron-daily-check.test.ts` (create)

### Interfaces (shared contracts)
- `getDbUri(request: Request): string | undefined` — keep export; body always `return undefined`.
- `connectToDatabase(customUri?: string): Promise<...>` — keep arity; ignore customUri.
- `sendEmail({ to, subject, text }): Promise<{ success: boolean; ... }>` — keep; may add `sendEmailBatch`.
- Cron secret: Bearer header first, then `?secret=`.

## Commands

```bash
# from the worktree you own
npm install   # if node_modules missing
npm test
npm run typecheck
npm run lint
```

## Code quality standard
Small single-purpose functions; clear names; no dead code; no magic numbers; consistent with existing style; explicit errors; comments explain WHY only; minimal deps.

## Superpowers (devs MUST load via skill tool before coding)
`test-driven-development`, `clean-code`, `systematic-debugging`, `verification-before-completion`, `code-review-and-quality`, `security-and-hardening`, `docify`

## Out of scope
Phases 2–4 of the fix masterplan; any git push to origin; changes to `next.config.ts`; rate-limit middleware; S3 migration.
