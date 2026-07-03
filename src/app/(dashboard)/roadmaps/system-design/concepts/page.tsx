'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import groups from '../../../../../../samundar-data/system-design-checklist';

export default function SystemDesignConceptsPage() {
  return (
    <div className="flex flex-col h-full ">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {groups.map((group, idx) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.02 }}
            >
              <Link
                href={`/roadmaps/system-design/concepts/group/${idx + 1}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/30 hover:border-zinc-700 text-left text-sm font-medium transition-all duration-200"
              >
                <span className="text-base shrink-0">{group.emoji}</span>
                <span className="truncate">{group.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
