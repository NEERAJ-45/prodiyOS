# Testing Patterns

**Analysis Date:** 2026-07-18

## Test Framework

**Runner:**
- **Vitest v4** (`vitest` ^4.1.9)
- Config: `vitest.config.ts` at project root
- Plugin: `@vitejs/plugin-react` v6 (for JSX support)

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`, `beforeEach`)
- `@testing-library/jest-dom` v6 extended matchers via setup file

**Run Commands:**
```bash
npm test                   # vitest run (single pass)
npm run test:watch         # vitest (watch mode, no config needed)
```

## Test File Organization

**Location:**
- **Co-located** under `__tests__` subdirectories near the module under test

**Naming:**
- Pattern: `<module-name>.test.ts` (kebab-case matching source file)
- Extensions: `.test.ts` only (no `.spec.ts` or `.test.tsx` files found)

**Structure:**
```
src/
├── data/
│   └── __tests__/
│       └── schedules.test.ts       # Tests for src/data/schedules.ts
├── lib/
│   ├── __tests__/
│   │   ├── setup.ts                # Test setup (global imports)
│   │   └── utils.test.ts           # Tests for src/lib/utils.ts
│   └── stores/
│       └── __tests__/
│           └── mode-store.test.ts  # Tests for src/lib/stores/mode-store.ts
```

**Setup File:**
- Location: `src/lib/__tests__/setup.ts`
- Content: Single import — `import '@testing-library/jest-dom/vitest';`
- Configured in `vitest.config.ts` via `setupFiles: './src/lib/__tests__/setup.ts'`

## Vitest Configuration

File: `vitest.config.ts` at project root

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@@': path.resolve(__dirname),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/lib/__tests__/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

Key settings:
- **`environment: 'jsdom'`** — DOM APIs available (localStorage, cookies)
- **`globals: true`** — `describe`, `it`, `expect`, `beforeEach` available without imports
- **`include: ['src/**/*.test.{ts,tsx}']`** — test file discovery pattern
- **Path aliases**: `@/` → `src/`, `@@/` → root (mirrors `tsconfig.json`)

## Test Structure

**Suite Organization:**

Test files use the standard Vitest pattern:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('module-name', () => {
  beforeEach(() => {
    // setup / reset state
  });

  it('describes the behavior', () => {
    // arrange
    // act
    // assert
  });
});
```

**Patterns:**
- **Describe**: One `describe` block per module/function using the module name as description string
- **It**: Descriptive strings in present tense, lowercase, describing behavior
- **Example**: `it('defaults to HOME')`, `it('toggles to OFFICE')`, `it('merges class names')`
- **Assertions**: Use Vitest `expect()` with `.toBe()`, `.toEqual()`, `.toHaveLength()`, `.toBeNull()`, `.toContain()`, `.toMatch()`
- **Pure function tests**: Arrange → Act → Assert with no mocking needed

## Mocking

**Framework:** No mocking library is used in existing tests. No usage of `vi.mock()`, `vi.spyOn()` detected.

**Patterns:** Tests avoid mocking entirely by testing:
- Pure utility functions (`cn()`)
- Zustand stores (direct `getState()`/`setState()` access)
- Static data validation (schedules structure)

**What to Mock (from conventions observed):**
- Not yet established — no existing tests use mocks
- Expected pattern: `vi.mock()` for service functions, `vi.fn()` for callbacks

**What NOT to Mock (from conventions observed):**
- Zustand stores — tested directly via `getState()`/`setState()`
- LocalStorage — real DOM environment provided by jsdom

## Fixtures and Factories

**Test Data:**
- Inline data in test files only — no separate fixture files found
- No factory functions or test data builders found

**Location:**
- No `test/` or `fixtures/` directories exist
- Data is hardcoded within test cases

## Coverage

**Requirements:** None enforced — no coverage thresholds in `vitest.config.ts`

**View Coverage:**
```bash
npx vitest --coverage
```
(Requires `@vitest/coverage-v8` to be installed — not currently in `devDependencies`)

## Test Types

**Unit Tests:**
- **Scope**: Pure functions, Zustand stores, static data validation
- **3 test files** currently exist (total ~150 lines of tests)
- No component tests (`*.test.tsx`) found
- No API route tests found

**Integration Tests:**
- **Not used** — no integration test files found

**E2E Tests:**
- **Not used** — no Playwright, Cypress, or other E2E framework in `package.json`

## Common Patterns

**Pure Function Testing:**
```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('handles undefined/null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});
```

**Zustand Store Testing:**
```typescript
// src/lib/stores/__tests__/mode-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useModeStore } from '@/lib/stores/mode-store';

describe('mode-store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
    });
    useModeStore.setState({ mode: 'HOME' });
  });

  it('defaults to HOME', () => {
    const { mode } = useModeStore.getState();
    expect(mode).toBe('HOME');
  });

  it('toggles to OFFICE', () => {
    useModeStore.getState().toggleMode();
    expect(useModeStore.getState().mode).toBe('OFFICE');
  });
});
```

**Static Data Testing:**
```typescript
// src/data/__tests__/schedules.test.ts
import { describe, it, expect } from 'vitest';
import { SCHEDULES, SCHEDULE_IDS, getDaySchedule } from '@/data/schedules';

describe('schedules', () => {
  it('has all schedules', () => {
    expect(SCHEDULE_IDS).toEqual(['steady', 'react', 'java', 'devops', 'custom']);
  });

  it('each schedule has 7 days', () => {
    for (const id of SCHEDULE_IDS) {
      expect(SCHEDULES[id].days).toHaveLength(7);
    }
  });

  it('getDaySchedule returns null for unknown day', () => {
    expect(getDaySchedule('steady', 'Funday')).toBeNull();
  });
});
```

**Async Testing:**
- No async tests currently exist in the codebase
- Expected pattern (from AGENTS.md conventions): Use `async/await` with TanStack Query hooks

**Error Testing:**
- No error-path tests currently exist
- Expected pattern: Test that service functions throw on non-ok responses, test that API routes return 400/500 for invalid input

## Coverage Gaps

- **No component tests** — no React Testing Library usage found despite `@testing-library/react` being in devDependencies
- **No API route tests** — no HTTP/fetch mocking
- **No TanStack Query hook tests** — hooks like `useCompletionsQuery`, `useDailyQuery` untested
- **No service function tests** — `src/lib/services/` functions untested
- **No Mongoose model tests** — schema validation untested
- **No error handling tests** — no tests for 400/500 responses or network failures
- **No edge case tests** for parsers (`src/lib/parsers.ts`) or large data files

## Commands Quick Reference

```bash
npm test                    # Run all tests (single pass)
npm run test:watch          # Run tests in watch mode
npx vitest run src/lib/__tests__/utils.test.ts  # Run specific test file
npx vitest --reporter=verbose  # Verbose output
```

---

*Testing analysis: 2026-07-18*
