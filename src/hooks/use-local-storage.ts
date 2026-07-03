'use client';

/**
 * use-local-storage.ts
 *
 * Generic hook + utility functions for localStorage CRUD with proper error
 * handling (no more silent `.catch(() => {})`).
 *
 * Pattern this extracts (duplicated across ~15 files):
 *   1. Load a value from localStorage (optionally JSON-parsed)
 *   2. Save a (possibly merged) value back to localStorage
 *
 * The hook itself is a thin wrapper; the real workhorses are the three
 * standalone utility functions (lsGet / lsSet / lsMerge) which can also be
 * called outside of React components (e.g., in service layer helpers).
 *
 * TODO: migrate QuestionsTable, ProblemsTable, daily, projects, revision,
 *       mastery, command-center, sticky-notes to use lsGet / lsSet instead
 *       of their inline loadData / saveData implementations.
 */

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Standalone utility functions (can be called outside React)
// ---------------------------------------------------------------------------

/**
 * Read a JSON-serialised value from localStorage.
 * Returns `defaultValue` on any error (key not found, JSON parse failure, SSR).
 */
export function lsGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[use-local-storage] lsGet("${key}") failed:`, err);
    return defaultValue;
  }
}

/**
 * Write a value to localStorage as JSON.
 * Logs a warning (instead of silently swallowing) on failure (e.g. quota exceeded).
 */
export function lsSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[use-local-storage] lsSet("${key}") failed:`, err);
  }
}

/**
 * Shallow-merge an object patch into the value stored at `key`.
 * The stored value is assumed to be a plain object; non-object stored values
 * are replaced entirely with the patch.
 */
export function lsMerge<T extends Record<string, unknown>>(
  key: string,
  patch: Partial<T>,
): void {
  const current = lsGet<T>(key, {} as T);
  const merged: T =
    current !== null && typeof current === 'object' && !Array.isArray(current)
      ? { ...current, ...patch }
      : (patch as T);
  lsSet(key, merged);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * React hook that mirrors a localStorage key as component state.
 *
 * @param key            localStorage key
 * @param defaultValue   value to use when the key is absent or unparseable
 *
 * Returns `[value, setValue]` — identical API to useState, but changes are
 * automatically persisted to localStorage.
 *
 * Example:
 *   const [tasks, setTasks] = useLocalStorage<Task[]>('samundar-tasks', []);
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    lsGet<T>(key, defaultValue),
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === 'function'
            ? (value as (prev: T) => T)(prev)
            : value;
        lsSet(key, next);
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
