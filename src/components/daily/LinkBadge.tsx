import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

export function LinkBadge({ isDone, roadmapLink }: { isDone: boolean; roadmapLink: string | null }) {
  if (!roadmapLink) return null;
  return (
    <Link
      href={roadmapLink}
      title="Open topic roadmap"
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:bg-zinc-700/50 hover:text-zinc-300 hover:border-zinc-600 transition-all shrink-0 ml-1.5",
        isDone && "opacity-50 pointer-events-none"
      )}
    >
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}
