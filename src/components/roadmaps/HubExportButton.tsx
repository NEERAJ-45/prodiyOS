'use client';

import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PillarRowData } from './RoadmapCardRow';

interface HubExportButtonProps {
  pillars: PillarRowData[];
  hubName: string;
}

export function HubExportButton({ pillars, hubName }: HubExportButtonProps) {
  const escapeCsv = (val: string) => {
    if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };

  const handleExportCSV = () => {
    const header = 'Pillar,Difficulty,Hours,Progress,Domains';
    const rows = pillars.map((p) => {
      const domains = p.domains?.map((d) => `${d.name}:${d.progress}%`).join('; ') ?? '';
      return [escapeCsv(p.name), p.difficulty, p.hours, `${p.progress}%`, escapeCsv(domains)].join(',');
    });
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hubName.toLowerCase().replace(/\s+/g, '-')}-overview.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const lines = pillars.map((p) => {
      const parts = [`[${p.progress}%] ${p.name} (${p.difficulty}, ${p.hours}h)`];
      p.domains?.forEach((d) => parts.push(`  - ${d.name}: ${d.progress}%`));
      return parts.join('\n');
    });
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hubName.toLowerCase().replace(/\s+/g, '-')}-overview.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700/50 text-zinc-300 bg-zinc-900/60 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors shrink-0">
          <Download size={13} />
          Export
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300 min-w-[140px]">
        <DropdownMenuItem onClick={handleExportCSV} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportText} className="text-xs cursor-pointer focus:bg-zinc-800 focus:text-zinc-100">
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
