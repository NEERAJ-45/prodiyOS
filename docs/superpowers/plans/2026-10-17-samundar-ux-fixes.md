# Samundar UX Fixes (B → A → C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/command-center` answer "what do I do now?" in one click, turn revision into a real spaced-repetition engine with intervals and ratings, and close data-trust leaks (empty userEmail, Daily date freeze, localStorage-only tasks, light-mode tokens on touched pages).

**Architecture:** Three workstreams in one branch. Pure scheduling logic lives in `src/lib/revision-scheduler.ts` (unit-tested). The revision page consumes it; a shared `useRevisionDueCount` hook feeds the same number to home, sidebar badge, and the revision tab. Tasks gain whole-list DB sync with a dirty flag (push-before-pull). All touched pages swap hardcoded `zinc-*` for theme tokens.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, TanStack Query v5, Mongoose, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-samundar-ux-fixes-design.md`

## Global Constraints

- `npm run lint`, `npm run typecheck`, `npm test` must pass after every task.
- No new npm dependencies.
- Query keys: `['revisions']` (existing), `['tasks']` (new). Mutations invalidate on success.
- API routes follow existing envelope in `src/app/api/db/revision/route.ts` (auth session email, `getDbUri`, `dbConnected` flag).
- Theme tokens only (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`) in touched files — no new hardcoded `zinc-*`/`slate-*` surfaces.
- Do not delete the legacy `completed` field from the Revision schema or localStorage payloads.

## Review Focus

- **Offline/failed revision save:** mutation errors must not silently drop local state; local-first still applies and `SyncStatus` must surface failure.
- **Legacy completed items:** backfill must run once and not re-push dueDates every load (idempotent guard).
- **Rating undo window:** rapid double-click or keyboard spam must not schedule twice or corrupt `stage`.
- **Tasks push-before-pull race:** a pull finishing after a newer local edit must not overwrite dirty local state.
- **Due-count drift:** home CTA, sidebar badge, and revision Due tab must show the same number from one helper.

---

### Task 1: Revision scheduler (pure logic)

**Files:**
- Create: `src/lib/revision-scheduler.ts`
- Test: `src/lib/__tests__/revision-scheduler.test.ts`

**Interfaces:**
- Produces:
  - `type Rating = 'again' | 'hard' | 'good' | 'easy'`
  - `INTERVALS: readonly number[]` = `[1, 3, 7, 21, 60]`
  - `MAX_STAGE = 4`
  - `applyRating(item: { stage: number; dueDate: string }, rating: Rating, today?: Date): { stage: number; dueDate: string; lastReviewedAt: string }`
  - `isDue(item: { dueDate: string; lastReviewedAt?: string | null }, today?: Date): boolean`
  - `daysUntilDue(dueDate: string, today?: Date): number`
  - `getDaysDiff(dateStr: string, today?: Date): number` (moved semantics from revision page; negative = overdue)
  - `backfillLegacyItems<T extends { stage: number; dueDate: string; completed?: boolean; lastReviewedAt?: string | null }>(items: T[], today?: Date): { items: T[]; changed: boolean }` — quiet backfill: for each item with `completed === true` and no `lastReviewedAt`, set `lastReviewedAt` to now-ISO and `dueDate` to today + INTERVALS[min(stage, MAX_STAGE)] days; leave all other items untouched.

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/__tests__/revision-scheduler.test.ts
import { describe, it, expect } from 'vitest';
import { applyRating, isDue, getDaysDiff, backfillLegacyItems, INTERVALS } from '../revision-scheduler';

const day = (n: number) => { const d = new Date('2026-10-17T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d; };

describe('applyRating', () => {
  it('good advances stage and uses ladder', () => {
    const r = applyRating({ stage: 0, dueDate: '2026-10-17' }, 'good', day(0));
    expect(r.stage).toBe(1);
    expect(r.dueDate).toBe('2026-10-18'); // INTERVALS[0] = 1
  });
  it('again resets stage to 0 and due tomorrow', () => {
    const r = applyRating({ stage: 3, dueDate: '2026-10-17' }, 'again', day(0));
    expect(r.stage).toBe(0);
    expect(getDaysDiff(r.dueDate, day(0))).toBe(1);
  });
  it('easy jumps two stages', () => {
    const r = applyRating({ stage: 0, dueDate: '2026-10-17' }, 'easy', day(0));
    expect(r.stage).toBe(2);
  });
  it('stage caps at MAX_STAGE', () => {
    const r = applyRating({ stage: 4, dueDate: '2026-10-17' }, 'good', day(0));
    expect(r.stage).toBe(4);
  });
});

describe('isDue', () => {
  it('due when dueDate is today or past', () => {
    expect(isDue({ dueDate: '2026-10-17' }, day(0))).toBe(true);
    expect(isDue({ dueDate: '2026-10-16' }, day(0))).toBe(true);
    expect(isDue({ dueDate: '2026-10-18' }, day(0))).toBe(false);
  });
});

describe('backfillLegacyItems', () => {
  it('pushes legacy completed items out and stamps lastReviewedAt', () => {
    const { items, changed } = backfillLegacyItems(
      [{ id: 'a', stage: 0, dueDate: '2026-01-01', completed: true }],
      day(0),
    );
    expect(changed).toBe(true);
    expect(items[0].lastReviewedAt).toBeTruthy();
    expect(getDaysDiff(items[0].dueDate, day(0))).toBe(INTERVALS[0]);
  });
  it('is idempotent', () => {
    const once = backfillLegacyItems([{ stage: 0, dueDate: '2026-01-01', completed: true }], day(0));
    const twice = backfillLegacyItems(once.items, day(0));
    expect(twice.changed).toBe(false);
    expect(twice.items[0].dueDate).toBe(once.items[0].dueDate);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/revision-scheduler.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/revision-scheduler.ts`**

Implement exactly the signatures above. `applyRating` rules:
- `again`: stage → 0, due = today+1d, lastReviewedAt = now-ISO.
- `hard`: stage unchanged, due = today + max(1, daysBetween(today, currentDueDate)+1) capped at 7d.
- `good`: stage = min(stage+1, MAX_STAGE), due = today + INTERVALS[stage] (post-increment index).
- `easy`: stage = min(stage+2, MAX_STAGE), due = today + ceil(INTERVALS[stage] * 1.5).
Dates: format dueDate as `YYYY-MM-DD` local-safe helper (reuse `toISOString().slice(0,10)` semantics but compute from a `today` Date param so tests are deterministic — add small internal `addDays(base, n)` and `formatDate`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/revision-scheduler.test.ts`
Expected: PASS all.

- [ ] **Step 5: Commit**

```bash
git add src/lib/revision-scheduler.ts src/lib/__tests__/revision-scheduler.test.ts
git commit -m "feat: add revision scheduler with SRS intervals and legacy backfill"
```

---

### Task 2: Revision model, service types, API — add `lastReviewedAt`

**Files:**
- Modify: `src/lib/models/Revision.ts` (add `lastReviewedAt: String, default null`)
- Modify: `src/lib/services/revision.ts` (add `lastReviewedAt?: string | null` to `RevisionRecord` and `SaveRevisionRequest`)
- Modify: `src/app/api/db/revision/route.ts` POST body destructure + update payload to include `lastReviewedAt` (optional, default null).

**Interfaces:**
- Consumes: nothing from Task 1 (schema only).
- Produces: `RevisionRecord.lastReviewedAt?: string | null` — Tasks 3–5 rely on this field name.

- [ ] **Step 1: Update model schema**

In `RevisionSchema`, add after `completed`:
```ts
lastReviewedAt: { type: String, default: null },
```
Add to `IRevision`: `lastReviewedAt?: string | null;`

- [ ] **Step 2: Update service types**

Add `lastReviewedAt?: string | null` to `RevisionRecord` and `SaveRevisionRequest`.

- [ ] **Step 3: Update API POST**

Destructure `lastReviewedAt` from body; include in `findOneAndUpdate` set object: `lastReviewedAt: lastReviewedAt ?? null`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/models/Revision.ts src/lib/services/revision.ts src/app/api/db/revision/route.ts
git commit -m "feat: persist lastReviewedAt on revision records"
```

---

### Task 3: Shared due-count hook + SyncStatus component

**Files:**
- Create: `src/hooks/use-revision-due.ts`
- Create: `src/components/shared/SyncStatus.tsx`

**Interfaces:**
- Consumes: `useRevisionsQuery` (existing), `isDue` from `revision-scheduler`.
- Produces:
  - `useRevisionDueCount(): number` — counts `isDue` items; mounts the `['revisions']` query app-wide (sidebar will call it). staleTime already 2 min in `use-revision.ts`.
  - `type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'`
  - `<SyncStatus state={SyncState} />` — renders a small chip: Idle → null; Saving… → muted; Saved → emerald; Offline → amber; Error → red. Classes use theme tokens only.

- [ ] **Step 1: Implement `useRevisionDueCount`**

```ts
export function useRevisionDueCount(): number {
  const { data } = useRevisionsQuery();
  return useMemo(
    () => (data?.data ?? []).filter((i) => isDue(i)).length,
    [data],
  );
}
```
(`isDue` accepts the record's `dueDate`/`lastReviewedAt`.)

- [ ] **Step 2: Implement `SyncStatus`**

Props: `{ state: SyncState; className?: string }`. Use `aria-live="polite"`. No zinc classes — `text-muted-foreground`, `text-emerald-500`, `text-amber-500`, `text-red-500`, `bg-card`, `border-border`.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-revision-due.ts src/components/shared/SyncStatus.tsx
git commit -m "feat: add shared revision due-count hook and SyncStatus chip"
```

---

### Task 4: Revision page — real SRS UI, Upcoming tab, URL param, fixes

**Files:**
- Modify: `src/app/(dashboard)/revision/page.tsx` (major rework of item type, check flow, tabs, seeds, tokens)
- Modify: `src/hooks/use-revision.ts` (query key includes userEmail: `['revisions', userEmail]` — check callers; sidebar/home share via same hook so key change is safe)

**Interfaces:**
- Consumes: `applyRating`, `isDue`, `getDaysDiff`, `backfillLegacyItems`, `INTERVALS` from Task 1; `RevisionRecord.lastReviewedAt` from Task 2; `SyncStatus` from Task 3.
- Produces: page reads `?tab=due|completed|upcoming` via `useSearchParams` + `router.replace`; exports nothing.

- [ ] **Step 1: Update `RevisionItem` and load path**

```ts
interface RevisionItem {
  id: string; concept: string; stage: number;
  dueDate: string; completed: boolean;
  lastReviewedAt?: string | null;
}
```
In the `useEffect` load: after parsing DB or localStorage, run `backfillLegacyItems` once; if `changed`, persist (localStorage + for each changed item `saveRevisionMutation.mutate` with real `userEmail` from `useProfile()`).

- [ ] **Step 2: Fix save identity + wire rating**

Replace `userEmail: ''` with `userEmail` from `useProfile()`. Replace `handleCheck` body: on complete, `applyRating(item, 'good')` → set state, save; set `ratingUndoId = item.id` and clear after 5000ms. Render inline rating row on that card (Again/Hard/Good/Easy buttons, `aria-label`s, keyboard 1–4 while `ratingUndoId` active). Each rating calls `applyRating` with that rating and clears undo. Guard re-entry: ignore rating clicks if already settled (id present but timer cleared).

- [ ] **Step 3: Tabs + filters**

- Due: `!completed && isDue(item)`.
- Completed: `lastReviewedAt` within last 7 days (`getDaysDiff` inverse — items where `(now - lastReviewedAt) < 7d`).
- Upcoming: `!isDue(item)` and not in Completed window, sorted by `dueDate`, grouped headers This week / Next week / Later.
- Initial tab from `useSearchParams().get('tab') ?? 'due'`; on change `router.replace('/revision?tab=' + next, { scroll: false })`.

- [ ] **Step 4: Remove defaultSeeds auto-persist**

Delete `defaultSeeds` localStorage seeding. Empty Due state: "No topics due — add a concept or pick one from a roadmap." Keep Add Topic dialog. Add dismissible sample chips (not persisted) optional — builder may skip samples entirely.

- [ ] **Step 5: Theme tokens**

Swap `bg-zinc-950`→`bg-background`, `border-zinc-800`→`border-border`, `text-zinc-100/200/300/400/500`→`text-foreground`/`text-muted-foreground` as appropriate on this page and its dialogs.

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Manual check notes for reviewer: complete a topic → item leaves Due, appears Upcoming with future date; `?tab=upcoming` loads correct tab.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(dashboard)/revision/page.tsx" src/hooks/use-revision.ts
git commit -m "feat: real spaced-repetition ratings, upcoming tab, identity fix"
```

---

### Task 5: Command Center — action bar, clickable due, reset move

**Files:**
- Modify: `src/app/(dashboard)/command-center/page.tsx`

**Interfaces:**
- Consumes: `useRevisionDueCount` (Task 3).
- Produces: nothing exported.

- [ ] **Step 1: Action bar above stats**

After header, before stats grid:
```tsx
<div className="flex flex-wrap gap-3">
  <Link href="/revision?tab=due" className="...primary button styles...">
    Due Revisions ({dueCount}) <ArrowRight />
  </Link>
  <Link href="/daily" className="...secondary...">Today's Plan</Link>
</div>
```
Disabled/hidden count `0` still shows link ("All caught up" label when 0).

- [ ] **Step 2: Clickable Due Revisions focus row**

Wrap the Due Revisions focus item in `<Link href="/revision?tab=due">`; remove the non-editable special case so it is always a link, never the edit dialog.

- [ ] **Step 3: Remove header Reset button**

Delete the Reset Dashboard button from the header JSX. Keep the dialog state; export a small `onOpenReset` via props is unnecessary — instead move dialog + trigger into Navbar profile (Task 6). For this task, just remove header button and dialog usage here.

- [ ] **Step 4: Theme tokens**

Swap zinc surface/text classes to tokens on this page.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/command-center/page.tsx"
git commit -m "feat: home action bar and clickable due revisions"
```

---

### Task 6: Sidebar badge + move Reset Dashboard to Navbar profile

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/mobile-nav.tsx` (badge on Revision item too)
- Modify: `src/components/layout/navbar.tsx` (add Reset Dashboard row in profile dialog; re-add the dialog + handleReset moved from command-center)

**Interfaces:**
- Consumes: `useRevisionDueCount` (Task 3).
- Produces: nothing.

- [ ] **Step 1: Sidebar badge**

In `renderLink` for the Revision item (or special-case after renderLink), if `label === 'Revision System'` and `dueCount > 0`, render `<span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 text-[10px] font-semibold text-red-500">{dueCount}</span>` with `aria-label={`${dueCount} revisions due`}`. Call `useRevisionDueCount()` once in `Sidebar`.

- [ ] **Step 2: Mobile nav badge**

Same badge logic on the Revision row in `mobile-nav.tsx` (call hook inside `MobileNav`).

- [ ] **Step 3: Navbar profile — Reset Dashboard**

In profile dialog (`navbar.tsx` ~line 142+), add a danger row button "Reset Dashboard" that opens the reset dialog (move the Dialog JSX + `handleReset` + `resetDialogOpen` state from command-center here). Copy: "Clears cached dashboard data and reloads fresh stats."

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx src/components/layout/navbar.tsx
git commit -m "feat: revision due badge in nav, reset dashboard in profile"
```

---

### Task 7: Daily — date freeze fix, SyncStatus, tokens

**Files:**
- Modify: `src/app/(dashboard)/daily/page.tsx`

**Interfaces:**
- Consumes: `SyncStatus` from Task 3.
- Produces: nothing.

- [ ] **Step 1: Move date constants into component**

Remove module-scope `today`, `dateStr`, `todayKey`, `todayDayName`. Inside `DailyPage`, compute from state `now` (default `new Date()`); add `useEffect` with `visibilitychange` listener + `setInterval(60_000)` that checks if `now.toDateString() !== new Date().toDateString()` and updates `now`. Derive `todayKey` via `useMemo` on `now`. Thread `todayKey` through existing effects (they already use it).

- [ ] **Step 2: SyncStatus wiring**

Track a local `syncState`: set `'saving'` when `syncDaily.mutate` starts, `'saved'` on success, `'error'` on error, `'offline'` when `navigator.onLine === false`. Render `<SyncStatus state={syncState} />` near the date header.

- [ ] **Step 3: Theme tokens**

Swap hardcoded zinc classes on this page to tokens.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/daily/page.tsx"
git commit -m "fix: daily date rollover, sync status chip, theme tokens"
```

---

### Task 8: Tasks DB sync (model, route, hooks, page)

**Files:**
- Create: `src/lib/models/TaskDoc.ts` (Mongoose model; collection stores whole list per user: `{ userEmail, tasks: [Task], updatedAt }` unique on userEmail)
- Create: `src/app/api/db/tasks/route.ts` (GET list, POST replace whole list — mirror revision route auth/`getDbUri` pattern)
- Create: `src/lib/services/tasks.ts` (`fetchTasks`, `saveTasks` typed wrappers like revision service)
- Create: `src/hooks/use-tasks.ts`
- Modify: `src/app/(dashboard)/tasks/page.tsx`

**Interfaces:**
- Consumes: `Task` type from `tasks/task-tree.ts`.
- Produces:
  - `useTasksQuery()` → `['tasks', userEmail]` → `{ dbConnected, data: Task[] }`
  - `useSaveTasks()` mutation: `(tasks: Task[]) => void` POSTs `{ userEmail, tasks, updatedAt: ISO }`.
  - Page dirty-flag pattern: any `setTasks` caller also sets `dirty=true`; effect: when dirty && online → save (clear dirty on success); on `online` event retry; initial load: if dirty, push local first then pull; else pull and `setTasks` if DB has data.

- [ ] **Step 1: Model + route + service**

`TaskDoc` schema: `userEmail: String required unique`, `tasks: [mongoose.Schema.Types.Mixed]`, `updatedAt: String`. Route GET: return `{ dbConnected, data: doc?.tasks ?? [] }`. POST: body `{ tasks }` (userEmail from session, not body — same as revision); `findOneAndUpdate({ userEmail }, { tasks, updatedAt }, { upsert: true })`.

- [ ] **Step 2: Hooks**

Mirror `use-revision.ts` structure with query key `['tasks', userEmail]`, staleTime 2 min.

- [ ] **Step 3: Page integration**

Replace bare `saveTasks` localStorage-only effect with: still write localStorage every change (local-first); set dirty; debounced (2000ms) push via `useSaveTasks` when dirty && online; `useEffect` on mount loads query data when `dbConnected && !dirty`; `window.addEventListener('online', retry)`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/models/TaskDoc.ts src/app/api/db/tasks/route.ts src/lib/services/tasks.ts src/hooks/use-tasks.ts "src/app/(dashboard)/tasks/page.tsx"
git commit -m "feat: sync tasks to MongoDB with push-before-pull dirty flag"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full gates**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all PASS.

- [ ] **Step 2: Manual smoke (reviewer)**

- Home shows Due count matching Revision Due tab.
- Complete a topic with Good → leaves Due, lands Upcoming ~1–3 days out; sidebar badge decrements.
- Check `userEmail` in network tab on revision save (non-empty).
- Open Daily, leave tab past midnight (or mock date), refocus → date updates.
- Add task, clear site storage, reload → task returns from DB.
- Toggle light mode on /revision, /command-center, /daily — text readable.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -A && git commit -m "chore: final verification fixes"
```
