# Samundar UX Fixes — Design (B → A → C)

Date: 2026-10-17
Status: approved — builder-check resolved (see Resolved Questions)

## Intent / Why

A UX review of the codebase found three structural problems:

1. The home screen (`/command-center`) shows vanity metrics but never tells the user what to do next. The one actionable row, "Due Revisions," is explicitly non-interactive (`command-center/page.tsx:179`).
2. The spaced-repetition feature — the product's entire differentiator — has no repetition intervals, no rating step, and no scheduling. It is a due-date checkbox (`revision/page.tsx`). The `stage` field exists but is never read or advanced.
3. Trust leaks: revision saves pass `userEmail: ''` (`revision/page.tsx:98`), tasks are localStorage-only (`tasks/page.tsx:136-138`), Daily computes `todayKey` at module scope (`daily/page.tsx:28-34`) so an open tab goes stale at midnight, and hardcoded `zinc-*` colors likely break light mode on core pages.

Priority order chosen by the product owner: **B (home activation) → A (honest SRS) → C (trust leaks)**.

## Goals

- B: from `/command-center`, a user answers "what now?" in under 5 seconds and reaches the next action in one click.
- A: completing a revision schedules the *next* review at a computed date; the app shows what is coming up.
- C: user data survives cache clears, sync state is visible, light mode works on the three touched pages.

## Non-goals (explicitly out of scope)

- Full sidebar regroup / mobile bottom-nav redesign (follow-up).
- Analytics weak-area → roadmap CTAs (follow-up).
- Complete WCAG sweep of all icon buttons app-wide (only files touched in these workstreams get a11y fixes).
- Merging Tasks / Daily / Study Plan overlap — separate product decision.
- Onboarding wizard changes.
- Changing auth/lockout flows (already good).

## Anti-goals

- Do not rebuild the whole app or introduce a new component library.
- Do not change the MongoDB/API envelope conventions documented in AGENTS.md.
- Do not remove existing localStorage behavior before DB sync is verified working (local-first must stay).
- No new npm dependencies unless unavoidable (framer-motion, TanStack Query, Radix already exist).

## Constraints

- Stack: Next.js App Router, Tailwind CSS v4, MongoDB/Mongoose, NextAuth v5, TanStack Query v5, Zustand.
- Client pages use `'use client'`; API routes under `src/app/api/`.
- Query keys follow `['resource', ...params]`; mutations invalidate on success.
- Shared hooks live in `src/hooks/`, one file per API resource.
- Verification: `npm run lint` and `npm run typecheck` must pass.

## Workstream B — Home activation (`/command-center`)

Decisions:

1. Add a top action bar above the stats grid with two CTAs:
   - `Due Revisions (N) →` → `/revision?tab=due`
   - `Today's Plan →` → `/daily`
2. Due count comes from the existing `useRevisionsQuery()` — same due logic as the revision page (`!completed && getDaysDiff(dueDate) <= 0`). Extract that filter into a shared helper so home and revision page cannot drift.
3. Make the "Due Revisions" row in Today's Focus fully clickable (wrap in `Link` to `/revision?tab=due`), replacing the `editable = false` dead-end.
4. Sidebar `Revision System` link gets a red count badge driven by the same due-count hook (hook must be cheap: reuse the already-fetched `['revisions']` query, no extra network call).
5. Move `Reset Dashboard` out of the header into the profile dialog (Navbar profile dialog, `navbar.tsx:114+`).
6. Loading state: keep spinner for full-page load; no skeleton work in this pass.

## Workstream A — Real spaced repetition (`/revision`)

Decisions:

1. **Rating flow.** Checking an item (the existing circle button) acts as a shortcut for **Good**: advances stage, schedules next due date. After check-off, show a brief inline rating row (Again / Hard / Good / Easy) pre-selected on Good, letting the user adjust for ~5 seconds before it settles (undo window, not a modal). Keyboard: `1`–`4` during the window.
   - Rationale: product owner said "whatever you say"; keeping one-click preserves muscle memory while surfacing the real SRS step.
2. **Interval ladder** (pure function in `src/lib/revision-scheduler.ts`):
   - Again: stage → 0, due in 1 day.
   - Hard: due in `max(1, stage * 1)` clamped to current + 2 days minimum — simplification: Hard = current interval + 1 day capped at 7, stage unchanged.
   - Good: stage += 1, due in `INTERVALS[min(stage, 4)]` days where `INTERVALS = [1, 3, 7, 21, 60]` (index after increment).
   - Easy: stage += 2 (capped at 4), due in `INTERVALS[stage]` days × 1.5 rounded up.
   - Exact constants are the builder's call as long as: monotonic for Good, Again always resets to tomorrow, and `stage` is a non-negative integer capped at 4.
3. **Data model.** `RevisionItem.stage` becomes read/write. Persist `stage`, `dueDate`, `completed`, `concept`, `id`. Completed items keep `completed: true` and their next `dueDate`; "Completed" tab means "reviewed at least once today," not "archived forever" — re-check when their next due date arrives (item returns to Due when `dueDate` passes and it is marked due again). *Clarification for builder:* items with `completed: true` become due again when `dueDate <= today`; completing a review sets `completed: false` and a future `dueDate` — final resting state is `completed` only after rating Again? No: simplest model — **drop the binary completed lifecycle; an item is "due" or "not due." The Completed tab shows items reviewed in the last 7 days (review history).**
4. **Upcoming tab.** Third tab: items with `dueDate > today`, sorted ascending, grouped by week ("This week", "Next week", "Later").
5. **Fix identity bug.** Pass real `userEmail` from `useProfile()` at `revision/page.tsx:98`.
6. **Seed data.** Remove auto-seeding of fake topics into localStorage. First-run empty state: "No topics yet — add your first concept or pick from a roadmap" with the Add Topic CTA. If samples are kept, they render as a dismissible one-time list, never persisted to DB.
7. **Query param.** `/revision` reads `?tab=due|completed|upcoming` (matches Workstream B deep link); changes update the param via `router.replace`.
8. **Sync status chip** (shared component `SyncStatus`): Saving… / Saved / Offline — used on Revision now, Daily in Workstream C.

## Workstream C — Trust leaks

Decisions:

1. **Revision email bug** — covered in A5.
2. **Daily date freeze.** Move `today`, `dateStr`, `todayKey`, `todayDayName` from module scope into the component with a recompute on `visibilitychange` + a 60-second interval check for day rollover (`daily/page.tsx:28-34`).
3. **Sync status on Daily** — reuse `SyncStatus` chip from A8; the 2s debounced save loop already exists (`daily/page.tsx:165-184`).
4. **Tasks DB sync.** Add `/api/db/tasks` POST route mirroring the revision route pattern, a Mongoose model (`src/lib/models/Task.ts`), and `src/hooks/use-tasks.ts` with query + mutation following AGENTS.md conventions. Save debounced like Daily (2s), load merges DB over localStorage (DB wins, localStorage fallback when offline). Activity-log call stays as-is.
5. **Light mode on touched pages.** In files edited by B/A/C (command-center, revision, daily, plus their dialogs), replace hardcoded `zinc-900/950/100/400/800` surface/text classes with tokens: `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`. Full app audit is a follow-up. Verify by switching `ModeToggle` on `/revision`, `/command-center`, `/daily`.

## Resolved Questions (builder-check, 2026-10-17)

1. **Tasks sync model:** whole-list replace with push-before-pull. Local dirty flag set on any edit; when dirty and online, push full task list first, then pull. Deletions propagate via full replace. Offline: dirty stays set, `SyncStatus` shows Offline, retry on `online` event.
2. **Review history field:** add `lastReviewedAt` (ISO string) to `Revision`. Due filter = `dueDate <= today` only (no `completed` gating). Completed tab = items with `lastReviewedAt` within 7 days. Legacy `completed` field stays in schema, ignored.
3. **Upgrade backfill (owner chose quiet backfill):** on first load, if any legacy `completed: true` items exist with `lastReviewedAt` unset, set `lastReviewedAt` to the completion-era date if known else now, and push `dueDate` out per ladder stage (default stage 0 → +1 day from now for each, or stage-appropriate interval). Due list starts honest-but-empty; Completed tab repopulates gradually as items become due again.
4. **Sidebar badge fetch (owner chose background fetch):** `useRevisionsQuery` mounts app-wide via the shared due-count hook (sidebar + home + revision). staleTime 2 min. Constraint in Goals ("no extra network call") is lifted: one background fetch per staleTime is acceptable.

## What's left to the builder

- Exact keyboard/focus handling for the rating undo window.
- Exact Hard-interval constant (within constraints above).
- Mongoose schema field names for Task (must match localStorage task shape from `tasks/task-tree.ts`).
- Any route-handler auth headers mirroring existing revision/completions routes.
- Debounce interval details for task sync.
- Test additions if a test harness exists (repo currently has limited tests; at minimum lint+typecheck).

## Verification

- `npm run lint` passes.
- `npm run typecheck` passes.
- Manual: due count matches across home, sidebar badge, revision tab; completing a topic moves it out of Due and lands it on a future Upcoming date; `userEmail` present in saved revision payload; Daily page shows correct date after tab is left open past midnight; Tasks survive cache clear (DB) and still load offline (localStorage fallback); light mode readable on the three pages.
