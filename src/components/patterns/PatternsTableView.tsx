import { useMemo, useCallback, Dispatch, SetStateAction } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  PaginationState,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertCircle, ListOrdered, Info, Download, Clipboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { ImportDialog } from "@/components/patterns/ImportDialog";
import { escapeCsv, buildCsv, copyToClipboard } from "@/lib/export-utils";

export interface PatternRow {
  key: string;
  name: string;
  description?: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export interface PaginatedResponse {
  patterns: PatternRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SOLVING_ORDER = [
  "Two Pointers", "Binary Search", "Prefix Sum", "Kadane's Algorithm",
  "Fast & Slow Pointers", "Linked List Reversal", "Cyclic Sort", "Merge Intervals",
  "Monotonic Stack", "Binary Search on Answer", "Heap / Priority Queue – Top K",
  "Two Heaps", "K-way Merge", "Subsets", "Permutations",
  "Combinations / Combination Sum", "Backtracking", "Tree DFS", "Tree BFS",
  "Lowest Common Ancestor", "Trie", "Graph DFS", "Graph BFS", "Union Find",
  "Topological Sort", "Shortest Path – Dijkstra", "Minimum Spanning Tree", "Greedy",
  "Dynamic Programming – 1D", "0/1 Knapsack", "DP – Grid / 2D",
  "Longest Increasing Subsequence", "Longest Common Subsequence", "Bit Manipulation",
  "String Pattern Matching (KMP / Rabin-Karp)",
];

async function fetchAllPatterns(): Promise<PatternRow[]> {
  const res = await fetch("/api/patterns?page=1&pageSize=100");
  const all = await res.json();
  return all.patterns as PatternRow[];
}

interface PatternsTableViewProps {
  data?: PaginatedResponse;
  isLoading: boolean;
  hasError: boolean;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  onRetry: () => void;
  onSelectPattern: (key: string) => void;
}

export function PatternsTableView({
  data,
  isLoading,
  hasError,
  pagination,
  setPagination,
  onRetry,
  onSelectPattern,
}: PatternsTableViewProps) {
  const patternRows = useMemo(() => data?.patterns ?? [], [data]);
  const patternsColumnHelper = useMemo(() => createColumnHelper<PatternRow>(), []);

  const handleExportCSV = useCallback(async () => {
    try {
      const rows = (await fetchAllPatterns()).map((p, i) =>
        [i + 1, escapeCsv(p.name), escapeCsv(p.description || ""), p.easy, p.medium, p.hard, p.total].join(",")
      );
      const header = "#,Pattern,Description,Easy,Medium,Hard,Total";
      const blob = new Blob(["\uFEFF" + header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dsa-patterns.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ variant: "destructive", title: "Export failed" }); }
  }, []);

  const handleCopyCSV = useCallback(async () => {
    try {
      const rows = (await fetchAllPatterns()).map((p, i) => [
        String(i + 1), escapeCsv(p.name), escapeCsv(p.description || ""),
        String(p.easy), String(p.medium), String(p.hard), String(p.total),
      ]);
      copyToClipboard(buildCsv(["#", "Pattern", "Description", "Easy", "Medium", "Hard", "Total"], rows), "Patterns CSV");
    } catch { toast({ variant: "destructive", title: "Copy failed" }); }
  }, []);

  const handleExportText = useCallback(async () => {
    try {
      const lines = (await fetchAllPatterns()).map((p, i) => {
        const parts = [`${i + 1}. ${p.name}`];
        if (p.description) parts.push(`   ${p.description}`);
        parts.push(`   Easy: ${p.easy}  Medium: ${p.medium}  Hard: ${p.hard}  Total: ${p.total}`);
        return parts.join("\n");
      });
      const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dsa-patterns.txt";
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ variant: "destructive", title: "Export failed" }); }
  }, []);

  const columns = useMemo(() => [
    patternsColumnHelper.display({
      id: "srno",
      header: "#",
      cell: (info) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {info.row.index + 1 + pagination.pageIndex * pagination.pageSize}
        </span>
      ),
      size: 44,
    }),
    patternsColumnHelper.accessor("name", {
      header: "Pattern",
      cell: (info) => (
        <div className="text-left">
          <span className="font-medium text-foreground text-sm">{info.getValue()}</span>
          {info.row.original.description && (
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight line-clamp-1">
              {info.row.original.description}
            </p>
          )}
        </div>
      ),
    }),
    patternsColumnHelper.accessor("easy", {
      header: "Easy",
      cell: (info) => <span className="text-xs text-emerald-400 font-medium">{info.getValue()}</span>,
      size: 56,
    }),
    patternsColumnHelper.accessor("medium", {
      header: "Medium",
      cell: (info) => <span className="text-xs text-amber-400 font-medium">{info.getValue()}</span>,
      size: 64,
    }),
    patternsColumnHelper.accessor("hard", {
      header: "Hard",
      cell: (info) => <span className="text-xs text-red-400 font-medium">{info.getValue()}</span>,
      size: 56,
    }),
    patternsColumnHelper.accessor("total", {
      header: "Total",
      cell: (info) => <span className="text-xs font-semibold text-foreground">{info.getValue()}</span>,
      size: 56,
    }),
  ], [patternsColumnHelper, pagination.pageIndex, pagination.pageSize]);

  const table = useReactTable({
    data: patternRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4">
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">DSA Patterns</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Recommended solving order"
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="w-72 p-3 rounded-lg" sideOffset={8}>
                <p className="text-xs font-medium text-muted-foreground mb-2">Recommended solving order:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-xs text-foreground/80">
                  {SOLVING_ORDER.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1" />
            <ImportDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground bg-muted/30 hover:bg-muted/60 hover:text-foreground transition-colors shrink-0">
                  <Download size={13} />
                  Export
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground min-w-[160px]">
                <DropdownMenuItem onClick={handleExportCSV} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100 gap-2">
                  <Download size={12} /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyCSV} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100 gap-2">
                  <Clipboard size={12} /> Copy CSV to Clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportText} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
                  Export as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total} patterns` : "Loading..."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border relative">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-muted/50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="relative">
            <AnimatePresence>
              {isLoading ? (
                <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={columns.length} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Loading patterns...</p>
                    </div>
                  </td>
                </motion.tr>
              ) : hasError ? (
                <motion.tr key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={columns.length} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <p className="text-sm text-red-400">Failed to load patterns</p>
                      <button onClick={onRetry} className="text-xs text-primary hover:underline">
                        Retry
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ) : patternRows.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={columns.length} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ListOrdered className="h-8 w-8" />
                      <p className="text-sm">No patterns match your search</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                    className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer last:border-0"
                    onClick={() => onSelectPattern(row.original.key)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2.5 text-center"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 mt-4 border border-border rounded-lg bg-muted/20 text-sm text-muted-foreground">
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span>Showing</span>
            <span className="font-semibold text-foreground">
              {pagination.pageIndex * pagination.pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-semibold text-foreground">
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)}
            </span>
            <span>of</span>
            <span className="font-semibold text-foreground">{data.total}</span>
            <span>patterns</span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs">Show</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => { table.setPageSize(Number(e.target.value)); }}
                className="bg-background border border-border text-foreground text-[10px] sm:text-xs rounded px-1.5 sm:px-2 py-1 focus:outline-none focus:border-primary/50 transition-colors"
              >
                {[10, 15, 20, 30, 50].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="hidden sm:inline-flex p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
                title="First"
              >
                <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
                title="Previous"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="text-[10px] sm:text-xs px-1 sm:px-2 select-none whitespace-nowrap">
                <strong className="text-foreground font-semibold">{pagination.pageIndex + 1}</strong>
                <span className="hidden sm:inline"> of </span>
                <span className="hidden sm:inline font-semibold text-foreground">{data.totalPages}</span>
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
                title="Next"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => table.setPageIndex(data.totalPages - 1)}
                disabled={!table.getCanNextPage()}
                className="hidden sm:inline-flex p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
                title="Last"
              >
                <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
