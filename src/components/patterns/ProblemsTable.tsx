"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { ExternalLink, CheckCircle, Circle } from "lucide-react";
import { ProblemDesc } from "./ProblemDesc";
import { cn } from "@/lib/utils";

interface ProblemItem {
  id: number;
  title: string;
  link: string;
}

interface ProblemsTableProps {
  patternName: string;
  easy: ProblemItem[];
  medium: ProblemItem[];
  hard: ProblemItem[];
  onBack: () => void;
}

const USER_NAME = "NEERAJ";

type CompletedMap = Record<string, string>;
type NotesMap = Record<string, string>;

function loadData<T>(pattern: string, key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${key}-${pattern}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveData<T>(pattern: string, key: string, data: T) {
  localStorage.setItem(`${key}-${pattern}`, JSON.stringify(data));
}

export function ProblemsTable({
  patternName,
  easy,
  medium,
  hard,
  onBack,
}: ProblemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const [completedMap, setCompletedMap] = useState<CompletedMap>(() =>
    loadData<CompletedMap>(patternName, "completed", {})
  );

  const [notesMap, setNotesMap] = useState<NotesMap>(() =>
    loadData<NotesMap>(patternName, "notes", {})
  );

  useEffect(() => {
    setCompletedMap(loadData<CompletedMap>(patternName, "completed", {}));
    setNotesMap(loadData<NotesMap>(patternName, "notes", {}));
  }, [patternName]);

  const toggleCompleted = useCallback(
    (id: number) => {
      setCompletedMap((prev) => {
        const key = String(id);
        const next = { ...prev };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = new Date().toISOString();
        }
        saveData(patternName, "completed", next);
        return next;
      });
    },
    [patternName]
  );

  const updateNote = useCallback(
    (id: number, value: string) => {
      setNotesMap((prev) => {
        const key = String(id);
        const next = { ...prev, [key]: value };
        if (!value) delete next[key];
        saveData(patternName, "notes", next);
        return next;
      });
    },
    [patternName]
  );

  const allProblems = useMemo(() => {
    const labeled: (ProblemItem & {
      difficulty: string;
      _difficultyOrder: number;
    })[] = [
      ...easy.map((p) => ({ ...p, difficulty: "EASY", _difficultyOrder: 0 })),
      ...medium.map((p) => ({
        ...p,
        difficulty: "MEDIUM",
        _difficultyOrder: 1,
      })),
      ...hard.map((p) => ({ ...p, difficulty: "HARD", _difficultyOrder: 2 })),
    ];
    return labeled;
  }, [easy, medium, hard]);

  const diffOrder: Record<string, number> = {
    EASY: 0,
    MEDIUM: 1,
    HARD: 2,
  };

  const columnHelper =
    createColumnHelper<(typeof allProblems)[number]>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "srno",
        header: "#",
        cell: (info) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {info.row.index + 1}
          </span>
        ),
        size: 44,
        minSize: 36,
      }),
      columnHelper.display({
        id: "done",
        header: "Done",
        cell: (info) => {
          const id = info.row.original.id;
          const done = !!completedMap[id];
          return (
            <button
              onClick={() => toggleCompleted(id)}
              className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {done ? (
                <CheckCircle size={16} className="text-emerald-500" />
              ) : (
                <Circle size={16} strokeWidth={1.5} />
              )}
            </button>
          );
        },
        size: 36,
        minSize: 32,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (info) => {
          const done = !!completedMap[info.row.original.id];
          return (
            <span
              className={cn(
                "text-sm transition-all",
                done
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              )}
            >
              {info.getValue()}
            </span>
          );
        },
        size: 240,
        minSize: 100,
      }),
      columnHelper.display({
        id: "desc",
        header: "Desc",
        cell: (info) => {
          const link = info.row.original.link;
          const slug = link
            .replace("https://leetcode.com/problems/", "")
            .replace("/", "");
          return <ProblemDesc slug={slug} />;
        },
        size: 60,
        minSize: 52,
      }),
      columnHelper.display({
        id: "notes",
        header: "Notes",
        cell: (info) => {
          const id = info.row.original.id;
          const val = notesMap[id] ?? "";
          return (
            <input
              value={val}
              onChange={(e) => updateNote(id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="..."
              className="w-full min-w-[60px] bg-transparent text-center text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          );
        },
        size: 140,
        minSize: 60,
      }),
      columnHelper.accessor("difficulty", {
        header: "Difficulty",
        sortingFn: (rowA, rowB) => {
          const a = diffOrder[rowA.original.difficulty] ?? 0;
          const b = diffOrder[rowB.original.difficulty] ?? 0;
          return a - b;
        },
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                val === "EASY" && "bg-emerald-500/15 text-emerald-400",
                val === "MEDIUM" && "bg-amber-500/15 text-amber-400",
                val === "HARD" && "bg-red-500/15 text-red-400"
              )}
            >
              {val.charAt(0) + val.slice(1).toLowerCase()}
            </span>
          );
        },
        size: 88,
        minSize: 72,
      }),
      columnHelper.display({
        id: "completedAt",
        header: "Completed",
        cell: (info) => {
          const dateStr = completedMap[info.row.original.id];
          if (!dateStr)
            return <span className="text-xs text-muted-foreground">--</span>;
          const d = new Date(dateStr);
          const formatted = d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          return (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatted}
            </span>
          );
        },
        size: 110,
        minSize: 80,
      }),
      columnHelper.display({
        id: "link",
        header: "Link",
        cell: (info) => (
          <a
            href={info.row.original.link}
            target="_blank"
            rel="noopener noreferrer"
            title={info.row.original.title}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        ),
        size: 40,
        minSize: 36,
      }),
    ],
    [columnHelper, completedMap, toggleCompleted, notesMap, updateNote]
  );

  const table = useReactTable({
    data: allProblems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });

  const solvedCount = useMemo(
    () => allProblems.filter((p) => completedMap[p.id]).length,
    [allProblems, completedMap]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          &larr; All Patterns
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {patternName}
        </h2>
        <span className="text-xs text-muted-foreground">
          {solvedCount}/{allProblems.length} solved
        </span>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{USER_NAME}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-muted/50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "mx-auto flex items-center gap-1",
                          header.column.getCanSort() &&
                            "cursor-pointer select-none"
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " \u2191",
                          desc: " \u2193",
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const done = !!completedMap[row.original.id];
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border transition-colors last:border-0",
                    done ? "bg-muted/20" : "hover:bg-muted/30"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="overflow-hidden px-3 py-2 text-center"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
