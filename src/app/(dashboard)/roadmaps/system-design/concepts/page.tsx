'use client';

import * as React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import groups from '../../../../../../samundar-data/system-design-checklist';
import type { QuestionItem } from '@/components/roadmaps/QuestionsTable';

const QuestionsTable = dynamic(() => import('@/components/roadmaps/QuestionsTable'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-zinc-500">Loading...</p>
    </div>
  ),
});

export default function SystemDesignConceptsPage() {
  const [selected, setSelected] = React.useState<number | null>(null);
  const selectedGroup = selected !== null ? groups[selected] : null;

  const questions: QuestionItem[] = React.useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.items.map(item => ({
      id: item.id,
      title: item.text,
      difficulty: 'MEDIUM',
      link: '',
    }));
  }, [selectedGroup]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <Link
          href="/roadmaps/system-design"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to System Design Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">System Design Concepts</h1>
          <p className="text-sm text-zinc-500 mt-1">Complete coverage across all system design areas</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-6">
          {groups.map((group, idx) => (
            <motion.button
              key={group.title}
              onClick={() => setSelected(selected === idx ? null : idx)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.02 }}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm font-medium
                transition-all duration-200
                ${selected === idx
                  ? 'border-primary/40 bg-primary/10 text-zinc-100 shadow-sm'
                  : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/30 hover:border-zinc-700'}
              `}
            >
              <span className="text-base shrink-0">{group.emoji}</span>
              <span className="truncate">{group.title}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedGroup && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <span>{selectedGroup.emoji}</span>
                  {selectedGroup.title}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <QuestionsTable
                questions={questions}
                storagePrefix="system-design-concepts"
                searchPlaceholder={`Search ${selectedGroup.title.toLowerCase()}...`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
