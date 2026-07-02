'use client';

import * as React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { GroupTable, useChecklistProgress } from '@/components/checklist/GroupTable';
import groups from '../../../../../../../../samundar-data/system-design-checklist';

const STORAGE_KEY = 'system-design-checklist-progress';

function syncWithDB(userEmail: string, getAll: () => Record<string, boolean>) {
  const headers = { 'Content-Type': 'application/json', 'x-user-email': userEmail };
  const all = getAll();
  for (const [itemId, checked] of Object.entries(all)) {
    fetch('/api/db/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        storagePrefix: STORAGE_KEY,
        itemId,
        completedAt: checked ? new Date().toISOString() : undefined,
        userEmail,
      }),
    }).catch(() => {});
  }
}

export default function GroupDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const idx = parseInt(slug, 10);
  const group = !isNaN(idx) && idx >= 1 && idx <= groups.length ? groups[idx - 1] : null;
  const { userEmail } = useProfile();

  const { completedMap, isLoading, toggle } = useChecklistProgress();

  const allProgress = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  React.useEffect(() => {
    if (userEmail) syncWithDB(userEmail, allProgress);
  }, [userEmail, allProgress]);

  if (!group) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Link
            href="/roadmaps/system-design/concepts"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to System Design Concepts
          </Link>
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <p className="text-sm">Group not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        <Link
          href="/roadmaps/system-design/concepts"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to System Design Concepts
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>{group.emoji}</span>
            {group.title}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <GroupTable
            group={group}
            completedMap={completedMap}
            onToggle={toggle}
          />
        )}
      </div>
    </div>
  );
}
