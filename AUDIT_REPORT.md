# Audit Report — Samundar / ProdigyOS

## Summary

The codebase is feature-rich and ambitious but suffers from severe component bloat, massive single-file pages that mix data fetching, UI rendering, form state, localStorage CRUD, and DB sync — often exceeding 400 lines per file. TypeScript usage is weak (abundant `any`), there's a duplicated toast library dependency, no error boundaries at the route level, and the data layer has two competing sync strategies (inline `useEffect`+`fetch` vs. shared React Query hooks) used inconsistently even within the same codebase.

## Files by size (largest first)

| File | Lines | Responsibilities mixed |
|---|---|---|
| `src/components/roadmaps/QuestionsTable.tsx` | 1087 | Defines types + table state + column defs + inline `AddTopicDialog` + inline reset dialog + localStorage CRUD + DB sync (completions/notes/custom-topics) + search/filter + pagination UI |
| `src/app/(dashboard)/daily/page.tsx` | 1009 | Schedule display + slot completion toggles + catch-up section + custom task CRUD + Pomodoro timer (interval logic, audio) + daily notes + streak calc + localStorage sync + DB sync |
| `src/components/patterns/ProblemsTable.tsx` | 764 | Same as QuestionsTable but for patterns: types + table + inline dialog + localStorage + DB sync + server/client pagination branches + toast notifications |
| `src/app/(dashboard)/projects/page.tsx` | 639 | Types + default seed data + `ProjectCard` component + `ExpandedDialog` component + full edit form dialog + delete confirmation dialog + localStorage + DB sync + search/filter + stats cards |
| `src/app/(dashboard)/analytics/page.tsx` | 575 | BarChart + CircularProgress + Streak computation + GroupedRoadmapTable + completion stats aggregation + localStorage scan + DB sync + search/filter |
| `src/app/(dashboard)/revision/page.tsx` | 528 | Types + default seed data + inline add/edit dialogs + Spaced-revision stage logic + localStorage + DB sync + tab UI |
| `src/app/(dashboard)/command-center/page.tsx` | 509 | Multiple inline skeleton loaders + stat cards + activity feed + project cards + sticky widget + localStorage + DB sync + `any` typed icon map |
| `src/app/(dashboard)/tasks/page.tsx` | 443 | Types + inline add/edit forms + filter/search + priority/status configs + localStorage |
| `src/app/(dashboard)/patterns/page.tsx` | 432 | Debounce hook + full table + ProblemsTable integration + URL param sync + server-paginated query |
| `src/app/(dashboard)/interview/page.tsx` | 417 | Types + default seed + ConfidenceDots + TypeBadge + inline dialog + search/filter + localStorage |
| `src/app/(dashboard)/roadmaps/frontend/machine-coding/page.tsx` | 411 | Static dataset (~380 lines of data) + QuestionsTable usage |
| `src/app/(dashboard)/mastery/page.tsx` | 405 | localStorage scan + DB sync + filter + stats cards |
| `src/samundar-data/system-design-checklist.ts` | 393 | Pure data (acceptable) |
| `src/lib/repository/static-repository.ts` | 334 | Likely **dead code** — not imported anywhere in active use |
| `src/app/(dashboard)/books/page.tsx` | 329 | Types + book/paper cards + slider component + tabs + progress calc + localStorage + DB sync |
| `src/app/(dashboard)/career/page.tsx` | 322 | Pure display content + static data (acceptable) |
| `src/app/(dashboard)/interviews/companies/[companyId]/page.tsx` | 292 | Kanban board + application details + notes + status flow |
| `src/app/(auth)/login/page.tsx` | 291 | `DecryptedText` component + login form + reset-password flow + brute-force error + inline CSS |
| `src/app/(dashboard)/sticky-notes/page.tsx` | 288 | Types + color config + localStorage + DB sync + add/edit/delete |
| `src/app/(dashboard)/history/page.tsx` | 285 | Daily record viewer + pagination + tabs + meeting-requirement logic |
| `src/components/checklist/GroupTable.tsx` | 285 | Full table + progress mutation + expand/collapse + localStorage |
| `src/app/(dashboard)/roadmaps/devops-cloud/page.tsx` | 282 | Static content + QuestionsTable |
| `src/app/(dashboard)/roadmaps/orms/page.tsx` | 274 | Static content + QuestionsTable |
| `src/app/(dashboard)/roadmaps/databases/sql/page.tsx` | 270 | Static content + QuestionsTable |
| `src/app/(auth)/register/page.tsx` | 269 | `DecryptedText` component + registration form + password confirm + role selection |
| `src/app/(dashboard)/roadmaps/frontend/page.tsx` | 267 | Static content + QuestionsTable |
| `src/app/(dashboard)/interviews/applications/page.tsx` | 263 | Application table + inline dialog |
| `src/components/layout/navbar.tsx` | 261 | Breadcrumbs + GlobalSearch + mode toggle + DB status + user profile dialog (with email change + password) + random quote |
| `src/app/(dashboard)/roadmaps/foundation/page.tsx` | 256 | Static content + QuestionsTable |
| `src/data/roadmaps.ts` | 250 | Pure data (acceptable, could split by category) |
| `src/app/(dashboard)/weekly/page.tsx` | 249 | Static schedule UI (acceptable) |

## Proposed new file structure

```
src/
  app/
    (dashboard)/
      daily/
        page.tsx                       <- strip down, delegate to:
        _components/
          ScheduleCard.tsx
          SlotRow.tsx
          CatchUpSection.tsx
          CustomTaskList.tsx
          CustomTaskForm.tsx
          FocusTimer.tsx
          DailyReflection.tsx
          DailyStats.tsx
      projects/
        page.tsx
        _components/
          ProjectCard.tsx
          ExpandedProjectDialog.tsx
          ProjectEditDialog.tsx
          ProjectDeleteDialog.tsx
          ProjectForm.tsx
      revision/
        page.tsx
        _components/
          RevisionCard.tsx
          RevisionAddDialog.tsx
          RevisionEditDialog.tsx
      analytics/
        page.tsx
        _components/
          BarChart.tsx
          CircularProgress.tsx
          GroupedRoadmapTable.tsx
          StreakDisplay.tsx
      command-center/
        page.tsx
        _components/
          StatsCard.tsx
          FocusItems.tsx
          ProjectSummary.tsx
          ActivityFeed.tsx
          StickyWidget.tsx
      tasks/
        page.tsx
        _components/
          TaskItem.tsx
          TaskForm.tsx
      interviews/
        page.tsx
        _components/
          ApplicationCard.tsx
          ApplicationForm.tsx       <- already exists but move from components/interviews/
      patterns/
        page.tsx
      mastery/
        page.tsx
      ...
    (auth)/
      login/
        page.tsx
        _components/
          DecryptedText.tsx         <- also used in register -- extract to shared
      register/
        page.tsx
    api/
      db/
        completions/route.ts
        notes/route.ts
        custom-topics/route.ts
        daily/route.ts
        activity/route.ts
        projects/route.ts
        revision/route.ts
        profile/route.ts
        ...

  components/
    roadmaps/
      QuestionsTable.tsx             <- strip, split into:
      _components/
        QuestionsTable.tsx           <- table shell
        QuestionRow.tsx
        AddTopicDialog.tsx
        ResetProgressDialog.tsx
        ProgressSummary.tsx
    patterns/
      ProblemsTable.tsx              <- same refactor pattern
    shared/
      DataTable.tsx                  <- reusable tanstack table wrapper
      NotesDialog.tsx
      GlobalSearch.tsx
      DecryptedText.tsx

  hooks/
    use-completions.ts
    use-notes.ts
    use-custom-topics.ts
    use-daily.ts
    use-local-storage.ts             <- generalized CRUD hook
    use-debounce.ts
    useKeyboardShortcut.ts
    useMounted.ts
    use-profile.ts                   <- move useProfile from providers/

  lib/
    storage-keys.ts
    utils.ts
    db.ts
    schemas/                         <- zod schemas for forms
    services/
      completions.ts                 <- API service layer
      notes.ts
      custom-topics.ts
      daily.ts
      projects.ts
      ...
    stores/
      mode-store.ts
```

## Refactor plan (ordered by priority)

1. **`QuestionsTable.tsx` (1087 lines) and `ProblemsTable.tsx` (764 lines)** — Extract: inline dialogs -> separate files, localStorage CRUD -> shared `use-local-storage` hook, DB sync -> service layer in `lib/services/`, column defs can stay but simplify. **Why**: These are the two largest components and they're nearly identical -- they share the same pattern of localStorage + TanStack Table + DB sync + custom items + pagination. Extract a reusable `DataTable` wrapper.

2. **`daily/page.tsx` (1009 lines)** — Extract: FocusTimer, ScheduleCard, CatchUpSection, CustomTaskList, DailyReflection, DailyStats into separate component files under `_components/`. **Why**: The Pomodoro timer alone is 80+ lines of interval logic + audio, mixed with schedule display and task management. Current file is impossible to test or reason about.

3. **Consolidate toast library** — 6 files use `react-hot-toast` directly, 7 use `@/components/ui/toast`. Pick one. The wrapper `src/components/ui/toast.tsx` already re-exports from `react-hot-toast`, so just enforce the wrapper. **Why**: Dual import paths cause confusion and risk inconsistent behavior.

4. **Eliminate inline `fetch` + localStorage sync pattern** — Every page duplicates the pattern: `load from localStorage -> fetch from API -> merge -> save back to localStorage`. Extract into `use-local-storage.ts` hook and `lib/services/*` service layer. **Why**: ~15 files do this nearly identically; it's a bug farm (typos in storage keys, missing error handling, silent `.catch(()=>{})`).

5. **Eliminate `useEffect` + `setTimeout` debounce pattern** — At least 3 locations manually debounce with `setTimeout`. Extract a shared `useDebounce` hook (one already exists inline in `patterns/page.tsx`). **Why**: Duplication of a 6-line utility across files.

6. **Add TypeScript types** — Replace `any` in: API route handlers (`error: any`), `.filter((x: any) => ...)` in QuestionsTable/ProblemsTable/analytics, `icon: any` in command-center, `as any` casts in profile route. **Why**: These defeat the purpose of TypeScript and make refactoring dangerous.

7. **Add route-level error boundaries** — Currently no `error.tsx` files in any route group. Add them for `(dashboard)/`, `(auth)/`, and each major sub-route. **Why**: Without error boundaries, a crash in any client component takes down the entire dashboard.

8. **Add loading boundaries** — No `loading.tsx` files anywhere; pages show manual spinners but the App Router `loading.tsx` convention is unused. **Why**: This would simplify the `if (!mounted) return <spinner>` pattern repeated in 12+ pages.

9. **Remove dead code** — `src/lib/repository/static-repository.ts` (334 lines) appears unused. Verify deletion. **Why**: Unused code creates confusion and false signals about the architecture.

10. **Remove `DecryptedText` duplication** — Exists in both `login/page.tsx` and `register/page.tsx`. Extract to `components/shared/DecryptedText.tsx`. **Why**: Exact copy-paste of a 20-line component.

11. **Fix `formatRelativeTime` import style** — Available from `@/lib/utils` but also duplicated inline. Clean up. **Why**: Import inconsistency.

12. **Fix `ProblemsTable.tsx` line 99 artifact** — Typo `099999sm:max-w-[425px]` with repeated `9` digits in className string. **Why**: This is a CSS rendering bug.

## Specific issues found

### Inconsistent naming
- `ProblemsTable.tsx` uses `ProblemsTable` named export; `QuestionsTable.tsx` uses `default` export
- Storage keys: some use `-completed` suffix, some use `completed-` prefix (e.g., `completed-databases-leetcode` vs `foundation-os-completed`)
- `useMounted` hook named with past tense; used as `mounted` boolean
- Some files use `signOut` (NextAuth), others use `logout` (ProfileProvider context)

### Weak types
- `any` used for: API response type assertions (`x: any` in QuestionsTable, ProblemsTable, analytics, mastery), error types in route handlers, icon maps in command-center, `(session?.user as any)?.role` in ProfileProvider
- `Record<string, T>` patterns without stricter typing for completion maps
- Un-typed `fetch` responses parsed as `res.json()` without type guards

### Duplicated code
- `loadData`/`saveData` localStorage functions: exist in ProblemsTable (standalone functions), QuestionsTable (closure inside component), checklist (standalone function), and inline in most pages
- `getRequestHeaders()`: duplicated in QuestionsTable, ProblemsTable, mastery page
- DB sync logic (fetch + merge): duplicated across QuestionsTable, ProblemsTable, mastery, command-center, profile
- `DecryptedText`: duplicated in login/page.tsx and register/page.tsx

### Missing error handling
- `.catch(() => {})` used in 30+ locations -- swallows all errors silently
- No error boundaries at route level
- No form validation feedback in most pages (except application-form.tsx which uses zod)
- API routes use `try/catch (error: any)` returning `error.message` but don't handle specific error types

### Missing conventions
- No `loading.tsx` in any route
- No `error.tsx` in any route
- No `not-found.tsx` in any route
- All pages are `'use client'` even when they could be Server Components with client islands

### Environment/security
- `AUTH_SECRET` committed in `.env.local` (though `.env.local` is gitignored, still risky -- should use a generated secret with no checked-in value)
- No `NEXT_PUBLIC_*` variables exposed (good)
- `process.env` used only in server-side code (good)
- `x-user-email` header sent from every client request -- authenticated server should trust `auth()` session instead

## Risks / things to verify after refactor

- [ ] Verify `static-repository.ts` is unused before deleting
- [ ] Ensure question/item IDs remain stable across localStorage key migrations (some use numeric, some use string IDs)
- [ ] Test that `QuestionsTable` custom topics (stored by `Date.now()`) don't collide after refactor
- [ ] Confirm the `x-user-email` -> `auth()` session migration doesn't break existing API routes
- [ ] After extracting DB sync to services, verify `useEffect` deps don't cause infinite loops
- [ ] Verify Tailwind `placeholder:text-zinc-650` and `placeholder:text-zinc-655` are valid (zinc 650/655 don't exist in Tailwind palette -- these are typos)
- [ ] Verify that removing `'use client'` from any page doesn't break hooks/event handlers
- [ ] Test that pulling `DataTable` out as shared doesn't regress sorting/pagination in patterns vs roadmaps
- [ ] Consolidating toast library: ensure `react-hot-toast`'s `toast.dismiss()` still works through the wrapper
- [ ] After adding `error.tsx` and `loading.tsx`, verify existing manual spinners don't double-render
- [ ] Check that no data is lost during the localStorage-to-service migration -- backup existing localStorage entries before deploying
