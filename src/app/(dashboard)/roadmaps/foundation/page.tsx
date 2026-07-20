'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCardRow } from '@/components/roadmaps/RoadmapCardRow';
import { HubExportButton } from '@/components/roadmaps/HubExportButton';

const pillars = [
  {
    name: 'Operating Systems',
    slug: 'os',
    progress: 55,
    hours: 90,
    difficulty: 'Hard',
    domains: [
      { name: 'Process Management', progress: 65 },
      { name: 'Memory Management', progress: 50 },
    ],
  },
  {
    name: 'Computer Networks',
    slug: 'cn',
    progress: 60,
    hours: 85,
    difficulty: 'Medium',
    domains: [
      { name: 'TCP/IP Stack', progress: 75 },
      { name: 'Protocols', progress: 60 },
    ],
  },
  {
    name: 'DBMS',
    slug: 'dbms',
    progress: 75,
    hours: 80,
    difficulty: 'Medium',
    domains: [
      { name: 'SQL', progress: 90 },
      { name: 'NoSQL', progress: 60 },
    ],
  },
];

function computeFoundationProgress() {
  const getCompletedCount = (prefix: string, rangeStart: number, rangeEnd: number, exactIds?: number[]) => {
    try {
      const raw = localStorage.getItem(`${prefix}-completed`);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      const keys = Object.keys(data).map(Number);
      if (exactIds) {
        return keys.filter(k => exactIds.includes(k)).length;
      }
      return keys.filter(k => k >= rangeStart && k <= rangeEnd).length;
    } catch {
      return 0;
    }
  };

  const getOverallCount = (prefix: string) => {
    try {
      const raw = localStorage.getItem(`${prefix}-completed`);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      return Object.keys(data).length;
    } catch {
      return 0;
    }
  };

  const osOverall = getOverallCount('foundation-os');
  const osProcess = getCompletedCount('foundation-os', 101, 122);
  const osMemory = getCompletedCount('foundation-os', 123, 134);

  const cnOverall = getOverallCount('foundation-cn');
  const cnTcp = getCompletedCount('foundation-cn', 201, 218);
  const cnProtocols = getCompletedCount('foundation-cn', 219, 250);

  const sqlIds = [301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 336, 337, 338, 339, 340, 345, 350];
  const dbmsOverall = getOverallCount('foundation-dbms');
  const dbmsSql = getCompletedCount('foundation-dbms', 0, 0, sqlIds);
  const dbmsNosql = Math.max(0, dbmsOverall - dbmsSql);

  return {
    os: {
      overall: Math.round((osOverall / 50) * 100),
      process: Math.round((osProcess / 22) * 100),
      memory: Math.round((osMemory / 12) * 100),
    },
    cn: {
      overall: Math.round((cnOverall / 50) * 100),
      tcp: Math.round((cnTcp / 18) * 100),
      protocols: Math.round((cnProtocols / 32) * 100),
    },
    dbms: {
      overall: Math.round((dbmsOverall / 50) * 100),
      sql: Math.round((dbmsSql / 19) * 100),
      nosql: Math.round((dbmsNosql / 31) * 100),
    }
  };
}

export default function FoundationRoadmapPage() {
  const [progressData, setProgressData] = React.useState(computeFoundationProgress);

  React.useEffect(() => {
    const update = () => setProgressData(computeFoundationProgress());
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
        progress: progressData.os.overall,
        domains: [
          { ...pillars[0].domains[0], progress: progressData.os.process },
          { ...pillars[0].domains[1], progress: progressData.os.memory },
        ]
      },
      {
        ...pillars[1],
        progress: progressData.cn.overall,
        domains: [
          { ...pillars[1].domains[0], progress: progressData.cn.tcp },
          { ...pillars[1].domains[1], progress: progressData.cn.protocols },
        ]
      },
      {
        ...pillars[2],
        progress: progressData.dbms.overall,
        domains: [
          { ...pillars[2].domains[0], progress: progressData.dbms.sql },
          { ...pillars[2].domains[1], progress: progressData.dbms.nosql },
        ]
      }
    ];
  }, [progressData]);

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
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">CS Foundation</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Core Computer Science subjects including Operating Systems, Computer Networks, and DBMS
              </p>
            </div>
            <HubExportButton pillars={dynamicPillars} hubName="CS Foundation" />
          </div>
        </div>

        <div className="space-y-3">
          {dynamicPillars.map((pillar) => (
            <RoadmapCardRow
              key={pillar.name}
              pillar={pillar}
              href={`/roadmaps/foundation/${pillar.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
