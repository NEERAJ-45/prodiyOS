'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import groups from '../../../../../../samundar-data/system-design-checklist';

const QuestionsTable = dynamic(() => import('@/components/roadmaps/QuestionsTable'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-zinc-500">Loading system design concepts...</p>
    </div>
  ),
});

const conceptsQuestions = groups.flatMap(g =>
  g.items.map(item => ({
    id: item.id,
    title: item.text,
    difficulty: 'MEDIUM' as const,
    link: '',
  }))
);

export default function SystemDesignConceptsPage() {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/roadmaps/system-design"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to System Design Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">System Design Concepts</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Complete coverage across all system design areas — databases, caching, messaging, load balancers, APIs, and more.
            </p>
          </div>
        </div>

        <QuestionsTable
          questions={conceptsQuestions}
          storagePrefix="system-design-concepts"
          searchPlaceholder="Search concepts..."
        />
      </div>
    </div>
  );
}
