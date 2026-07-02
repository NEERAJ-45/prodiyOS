'use client';

import * as React from 'react';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useChecklistProgress, GroupTable } from '@/components/checklist/GroupTable';
import groups from '../../../../../../samundar-data/system-design-checklist';

export default function SystemDesignConceptsPage() {
  const [selected, setSelected] = React.useState<number | null>(null);
  const { completedMap, isLoading, toggle } = useChecklistProgress();
  const selectedGroup = selected !== null ? groups[selected] : null;

  return (
    <div className="flex flex-col h-full bg-background text-foreground min-h-screen">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <Link
          href="/roadmaps/system-design"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to System Design Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Design Concepts</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete coverage across all system design areas</p>
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
                relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm font-medium
                transition-all duration-200
                ${selected === idx
                  ? 'border-primary/40 bg-primary/10 text-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'}
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
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span>{selectedGroup.emoji}</span>
                  {selectedGroup.title}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <GroupTable
                  group={selectedGroup}
                  completedMap={completedMap}
                  onToggle={toggle}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


