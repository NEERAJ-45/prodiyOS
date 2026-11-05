'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DocReaderClient } from './doc-reader-client';
import { useFileNodeQuery } from '@/hooks/use-files';

export default function DocReaderPage() {
  const params = useParams();
  const { data, isLoading } = useFileNodeQuery((params.id as string) ?? null);

  const doc = data?.doc?.kind === 'folder' ? null : (data?.doc ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading doc...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-400">Doc not found.</p>
      </div>
    );
  }

  return <DocReaderClient doc={doc} />;
}
