"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


interface SearchResultProblem {
  id: string;
  title: string;
  difficulty: string;
  pattern: { name: string; slug: string };
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    patterns: { id: string; name: string; type: string; description?: string }[];
    problems: SearchResultProblem[];
  }>({ patterns: [], problems: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults({ patterns: [], problems: [] });
    setSelectedIndex(0);
  }, []);

  useKeyboardShortcut("k", handleOpen, { metaKey: true });

  useEffect(() => {
    if (query.length < 2) return;

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults({
          patterns: data.patterns ?? [],
          problems: data.problems ?? [],
        });
      } catch {
        setResults({ patterns: [], problems: [] });
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const allItems = useMemo(() => [
    ...results.patterns.map((p) => ({
      type: "pattern" as const,
      id: p.id,
      label: p.name,
      slug: p.id,
    })),
    ...results.problems.map((p) => ({
      type: "problem" as const,
      id: p.id,
      label: p.title,
      slug: p.pattern.slug,
      difficulty: p.difficulty,
    })),
  ], [results]);

  const handleSelect = useCallback(
    (item: (typeof allItems)[0]) => {
      handleClose();
      router.push(`/patterns?pattern=${item.slug}`);
    },
    [router, handleClose]
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(allItems[selectedIndex]);
      } else if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, allItems, selectedIndex, handleSelect, handleClose]);

  return (
    <>
      {/* Desktop trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search size={14} strokeWidth={1.5} />
        <span>Search...</span>
        <kbd className="ml-4 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center rounded-md border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Search"
      >
        <Search size={16} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-2 z-50 w-full max-w-lg"
            >
              <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <Search
                      size={16}
                      strokeWidth={1.5}
                      className="text-muted-foreground"
                    />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search problems and patterns..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  {allItems.length > 0 && (
                    <div className="max-h-80 overflow-y-auto p-2">
                      {results.patterns.length > 0 && (
                        <>
                          <p className="px-2 py-1 text-xs text-muted-foreground">Patterns</p>
                          {results.patterns.map((p, idx) => (
                            <button
                              key={`p-${p.id}`}
                              onClick={() =>
                                handleSelect({
                                  type: "pattern",
                                  id: p.id,
                                  label: p.name,
                                  slug: p.id,
                                })
                              }
                              className={cn(
                                "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm",
                                selectedIndex === idx
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground hover:bg-accent"
                              )}
                            >
                              <span>{p.name}</span>
                              {p.description && (
                                <span className="ml-2 truncate text-xs text-muted-foreground">
                                  {p.description}
                                </span>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                      {results.problems.length > 0 && (
                        <>
                          <p className="px-2 py-1 mt-2 text-xs text-muted-foreground">Problems</p>
                          {results.problems.map((p, idx) => {
                            const realIdx = results.patterns.length + idx;
                            return (
                              <button
                                key={`prob-${p.id}`}
                                onClick={() =>
                                  router.push(`/patterns?pattern=${p.pattern.slug}`)
                                }
                                className={cn(
                                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm",
                                  selectedIndex === realIdx
                                    ? "bg-accent text-accent-foreground"
                                    : "text-foreground hover:bg-accent"
                                )}
                              >
                                <span className="truncate">{p.title}</span>
                                <span className={cn(
                                  "ml-auto shrink-0 text-[10px] font-semibold uppercase",
                                  p.difficulty === 'EASY' && 'text-green-500',
                                  p.difficulty === 'MEDIUM' && 'text-amber-500',
                                  p.difficulty === 'HARD' && 'text-red-500',
                                )}>
                                  {p.difficulty}
                                </span>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}

                  {query.length >= 2 && allItems.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  )}
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
