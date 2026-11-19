'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const FileManager = dynamic(
  () => import('@/components/files/file-manager').then((mod) => mod.FileManager),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#2b2b2b] text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading files…
      </div>
    ),
  }
);

export default function DocsPage() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
      <FileManager />
    </div>
  );
}
