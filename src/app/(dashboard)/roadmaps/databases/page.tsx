'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCardRow } from '@/components/roadmaps/RoadmapCardRow';
import { HubExportButton } from '@/components/roadmaps/HubExportButton';

const pillars = [
  {
    name: 'SQL Database',
    slug: 'sql',
    progress: 0,
    hours: 100,
    difficulty: 'Medium',
    domains: [
      { name: 'SQL Theory', progress: 0 },
      { name: 'SQL LeetCode', progress: 0 },
    ],
  },
  {
    name: 'NoSQL Database',
    slug: 'nosql',
    progress: 0,
    hours: 80,
    difficulty: 'Medium-Hard',
    domains: [
      { name: 'Distributed Storage', progress: 0 },
    ],
  },
];

function computeDatabaseProgress() {
  const getCompletedCount = (prefix: string) => {
    try {
      const raw = localStorage.getItem(`${prefix}-completed`);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      return Object.keys(data).length;
    } catch {
      return 0;
    }
  };

  const sqlTheory = getCompletedCount('databases-sql');
  const sqlLeetcode = getCompletedCount('databases-leetcode');
  const nosqlTheory = getCompletedCount('databases-nosql');

  return {
    sqlTheoryPct: Math.round((sqlTheory / 50) * 100),
    sqlLeetcodePct: Math.round((sqlLeetcode / 50) * 100),
    sqlOverall: Math.round(((sqlTheory + sqlLeetcode) / 100) * 100),
    nosqlOverall: Math.round((nosqlTheory / 50) * 100),
  };
}

export default function DatabasesHubPage() {
  const [progress, setProgress] = React.useState(computeDatabaseProgress);

  React.useEffect(() => {
    const update = () => setProgress(computeDatabaseProgress());
    const bc = new BroadcastChannel('roadmap-progress');
    bc.onmessage = update;
    window.addEventListener('storage', update);
    return () => {
      bc.close();
      window.removeEventListener('storage', update);
    };
  }, []);

  const dynamicPillars = React.useMemo(() => {
    return [
      {
        ...pillars[0],
        progress: progress.sqlOverall,
        domains: [
          { name: 'SQL Theory', progress: progress.sqlTheoryPct },
          { name: 'SQL LeetCode', progress: progress.sqlLeetcodePct },
        ],
      },
      {
        ...pillars[1],
        progress: progress.nosqlOverall,
        domains: [
          { name: 'Distributed Storage', progress: progress.nosqlOverall },
        ],
      },
    ];
  }, [progress]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmaps
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Databases</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Select a specialized relational or non-relational path below to track your database mastery.
              </p>
            </div>
            <HubExportButton pillars={dynamicPillars} hubName="Databases" />
          </div>
        </div>

        <div className="space-y-3">
          {dynamicPillars.map((pillar) => (
            <RoadmapCardRow
              key={pillar.name}
              pillar={pillar}
              href={`/roadmaps/databases/${pillar.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
