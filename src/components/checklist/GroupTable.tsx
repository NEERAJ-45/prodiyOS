'use client';

import * as React from 'react';
import { CheckCircle, Circle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChecklistGroup } from '@/../samundar-data/system-design-checklist';

const STORAGE_KEY = 'system-design-checklist-progress';

function loadProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persistProgress(map: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
}

interface GroupRow {
  id: number;
  idx: number;
  text: string;
  depth: number;
  checked: boolean;
}

const columnHelper = createColumnHelper<GroupRow>();

export function useChecklistProgress() {
  const queryClient = useQueryClient();

  const { data: completedMap = {}, isLoading } = useQuery({
    queryKey: ['system-design-checklist-progress'],
    queryFn: loadProgress,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const current = loadProgress();
      const next = { ...current, [String(id)]: !current[String(id)] };
      persistProgress(next);
      return next;
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['system-design-checklist-progress'] });
      const prev = queryClient.getQueryData<Record<string, boolean>>(['system-design-checklist-progress']) ?? {};
      queryClient.setQueryData(['system-design-checklist-progress'], { ...prev, [String(id)]: !prev[String(id)] });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['system-design-checklist-progress'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['system-design-checklist-progress'] }),
  });

  const toggle = React.useCallback((id: number) => mutation.mutate(id), [mutation]);

  const resetMutation = useMutation({
    mutationFn: async () => { persistProgress({}); return {}; },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['system-design-checklist-progress'] });
      queryClient.setQueryData(['system-design-checklist-progress'], {});
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['system-design-checklist-progress'] }),
  });

  return { completedMap, isLoading, toggle, reset: () => resetMutation.mutate() };
}

export function GroupTable({
  group,
  completedMap,
  onToggle,
}: {
  group: ChecklistGroup;
  completedMap: Record<string, boolean>;
  onToggle: (id: number) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const data: GroupRow[] = React.useMemo(() =>
    group.items.map((it, i) => ({
      id: it.id,
      idx: i + 1,
      text: it.text,
      depth: it.depth,
      checked: completedMap[String(it.id)] ?? it.checked,
    })),
    [group.items, completedMap],
  );

  const columns = React.useMemo(() => [
    columnHelper.display({
      id: 'status',
      header: '',
      cell: (info) => (
        <button onClick={() => onToggle(info.row.original.id)} className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground">
          {info.row.original.checked ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : (
            <Circle size={16} strokeWidth={1.5} />
          )}
        </button>
      ),
      size: 36,
      enableSorting: false,
    }),
    columnHelper.display({
      id: 'idx',
      header: '#',
      cell: (info) => <span className="text-xs text-muted-foreground tabular-nums">{info.row.original.idx}</span>,
      size: 44,
    }),
    columnHelper.accessor('text', {
      header: 'Topic',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span
            className={cn('text-sm block text-left', row.checked ? 'text-muted-foreground line-through' : 'text-foreground')}
            style={{ paddingLeft: `${row.depth * 16}px` }}
          >
            {row.depth > 0 && <span className="text-border mr-1.5 select-none">{'└─'}</span>}
            {row.text}
          </span>
        );
      },
    }),
  ], [onToggle]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false,
  });

  const solvedCount = data.filter(r => r.checked).length;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-border bg-muted/50">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn('mx-auto flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer select-none')}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence>
              {table.getRowModel().rows.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan={columns.length} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <p className="text-sm">No items found</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03, ease: 'easeOut' }}
                    className={cn(
                      'border-b border-border transition-colors last:border-0',
                      row.original.checked ? 'bg-muted/20' : 'hover:bg-muted/30',
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="overflow-hidden px-3 py-2 text-center"
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

      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 mt-3 border border-border rounded-lg bg-muted/20 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 text-xs">
            <span>Showing</span>
            <span className="font-semibold text-foreground">
              {pagination.pageIndex * pagination.pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-semibold text-foreground">
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length)}
            </span>
            <span>of</span>
            <span className="font-semibold text-foreground">{data.length}</span>
            <span>topics</span>
            <span className="ml-2 font-semibold text-emerald-400">{solvedCount} done</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs">Show</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="bg-background border border-border text-foreground text-xs rounded px-2 py-1 focus:outline-none focus:border-primary/50 transition-colors"
              >
                {[10, 20, 30, 50].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors" title="First">
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Previous">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs px-2 select-none">
                Page <strong className="text-foreground font-semibold">{pagination.pageIndex + 1}</strong> of{' '}
                <strong className="text-foreground font-semibold">{table.getPageCount()}</strong>
              </span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Next">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}
                className="p-1.5 rounded border border-border bg-background hover:bg-muted/50 hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors" title="Last">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
