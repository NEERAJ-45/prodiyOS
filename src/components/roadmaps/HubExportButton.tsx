'use client';

import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import type { PillarRowData } from './RoadmapCardRow';

interface HubExportButtonProps {
  pillars: PillarRowData[];
  hubName: string;
}

export function HubExportButton({ pillars, hubName }: HubExportButtonProps) {
  const toFilenameBase = (value: string) => value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const escapeCsv = (val: string) => {
    if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };

  const downloadBlob = (filename: string, contents: string, mimeType: string) => {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buildCsv = (items: PillarRowData[]) => {
    const header = 'Pillar,Difficulty,Hours,Progress,Domains';
    const rows = items.map((p) => {
      const domains = p.domains?.map((d) => `${d.name}:${d.progress}%`).join('; ') ?? '';
      return [escapeCsv(p.name), p.difficulty, p.hours, `${p.progress}%`, escapeCsv(domains)].join(',');
    });
    return '\uFEFF' + header + '\n' + rows.join('\n');
  };

  const buildText = (items: PillarRowData[]) => {
    const lines = items.map((p) => {
      const parts = [`[${p.progress}%] ${p.name} (${p.difficulty}, ${p.hours}h)`];
      p.domains?.forEach((d) => parts.push(`  - ${d.name}: ${d.progress}%`));
      return parts.join('\n');
    });
    return lines.join('\n\n');
  };

  const exportPillarsAsCSV = (items: PillarRowData[], filenameSuffix: string) => {
    downloadBlob(
      `${toFilenameBase(hubName)}-${filenameSuffix}.csv`,
      buildCsv(items),
      'text/csv;charset=utf-8;'
    );
  };

  const exportPillarsAsText = (items: PillarRowData[], filenameSuffix: string) => {
    downloadBlob(
      `${toFilenameBase(hubName)}-${filenameSuffix}.txt`,
      buildText(items),
      'text/plain;charset=utf-8;'
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700/50 text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors shrink-0">
          <Download size={13} />
          Export
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300 min-w-[240px] max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Export Overview</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportPillarsAsCSV(pillars, 'overview')} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
          Overview as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportPillarsAsText(pillars, 'overview')} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
          Overview as Text
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-zinc-800" />

        <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Export Pillar</DropdownMenuLabel>
        {pillars.map((pillar) => (
          <DropdownMenuSub key={pillar.slug}>
            <DropdownMenuSubTrigger className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
              {pillar.name}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
              <DropdownMenuItem onClick={() => exportPillarsAsCSV([pillar], pillar.slug)} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPillarsAsText([pillar], pillar.slug)} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
                Export as Text
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
