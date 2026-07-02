'use client';

import * as React from 'react';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { useProfile } from '@/components/providers/ProfileProvider';
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
  showHeader = true,
  showFooter = true,
}: {
  group: ChecklistGroup;
  completedMap: Record<string, boolean>;
  onToggle: (id: number) => void;
  showHeader?: boolean;
  showFooter?: boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

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
        <button onClick={() => onToggle(info.row.original.id)} className="flex items-center justify-center mx-auto">
          {info.row.original.checked ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-400 transition-colors" strokeWidth={1.5} />
          )}
        </button>
      ),
      size: 32,
      enableSorting: false,
    }),
    columnHelper.display({
      id: 'idx',
      header: '#',
      cell: (info) => <span className="text-[11px] text-zinc-600 tabular-nums">{info.row.original.idx}</span>,
      size: 32,
    }),
    columnHelper.accessor('text', {
      header: 'Topic',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span
            className={cn('text-xs leading-snug block', row.checked ? 'text-zinc-500 line-through' : 'text-zinc-300')}
            style={{ paddingLeft: `${row.depth * 14}px` }}
          >
            {row.depth > 0 && <span className="text-zinc-700 mr-1.5 select-none">{'└─'}</span>}
            {row.text}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'link',
      header: '',
      cell: () => <span className="text-zinc-700 text-[10px]">—</span>,
      size: 28,
      enableSorting: false,
    }),
  ], [onToggle]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });

  const itemCount = data.length;
  const doneCount = data.filter(r => r.checked).length;
  const progress = itemCount > 0 ? Math.round((doneCount / itemCount) * 100) : 0;
  const barColor = progress === 100 ? '#22c55e' : progress >= 60 ? '#6366f1' : progress >= 30 ? '#a855f7' : '#52525b';

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg shrink-0">{group.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{group.title}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{doneCount}/{itemCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-1.5 w-20 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: barColor }} />
            </div>
            <span className={cn('text-xs font-semibold tabular-nums w-8 text-right', progress === 100 ? 'text-emerald-400' : 'text-zinc-400')}>{progress}%</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-zinc-800 bg-zinc-900/60">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn('mx-auto flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer select-none hover:text-zinc-300')}
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
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-zinc-800/40 transition-colors last:border-0',
                  row.original.checked ? 'bg-zinc-900/20' : 'hover:bg-zinc-800/15',
                )}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-2 py-1.5 text-center" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showFooter && (
        <div className="flex items-center justify-between px-4 md:px-5 py-2 border-t border-zinc-800/40 bg-zinc-900/30">
          {sorting.length > 0 && (
            <button onClick={() => setSorting([])} className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors">
              Clear sort
            </button>
          )}
          <button
            onClick={() => { for (const i of group.items) onToggle(i.id); }}
            className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors ml-auto"
          >
            Toggle all
          </button>
        </div>
      )}
    </div>
  );
}
