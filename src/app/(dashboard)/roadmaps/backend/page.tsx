'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCardRow } from '@/components/roadmaps/RoadmapCardRow';
import { HubExportButton } from '@/components/roadmaps/HubExportButton';

const pillars = [
  {
    name: 'Java',
    slug: 'java',
    progress: 0,
    hours: 100,
    difficulty: 'Medium',
    domains: [
      { name: 'Core Java', progress: 0 },
      { name: 'Advanced Java', progress: 0 },
    ],
  },
  {
    name: 'Spring Boot',
    slug: 'springboot',
    progress: 0,
    hours: 120,
    difficulty: 'Medium',
    domains: [
      { name: 'Core Spring & Web', progress: 0 },
      { name: 'Microservices', progress: 0 },
    ],
  },
];

function computeBackendProgress() {
  const getCompletedCountInRange = (prefix: string, rangeStart: number, rangeEnd: number) => {
    try {
      const raw = localStorage.getItem(`${prefix}-completed`);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      const keys = Object.keys(data).map(Number);
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

  const javaOverall = getOverallCount('backend-java');
  const javaCore = getCompletedCountInRange('backend-java', 601, 635);
  const javaAdvanced = getCompletedCountInRange('backend-java', 636, 650);

  const springOverall = getOverallCount('backend-springboot');
  const springCore = getCompletedCountInRange('backend-springboot', 701, 735);
  const springMicro = getCompletedCountInRange('backend-springboot', 736, 750);

  return {
    java: {
      overall: Math.round((javaOverall / 50) * 100),
      core: Math.round((javaCore / 35) * 100),
      advanced: Math.round((javaAdvanced / 15) * 100),
    },
    springboot: {
      overall: Math.round((springOverall / 50) * 100),
      core: Math.round((springCore / 35) * 100),
      micro: Math.round((springMicro / 15) * 100),
    }
  };
}

export default function BackendRoadmapPage() {
  const [progressData, setProgressData] = React.useState(computeBackendProgress);

  React.useEffect(() => {
    const update = () => setProgressData(computeBackendProgress());
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
        progress: progressData.java.overall,
        domains: [
          { ...pillars[0].domains[0], progress: progressData.java.core },
          { ...pillars[0].domains[1], progress: progressData.java.advanced },
        ]
      },
      {
        ...pillars[1],
        progress: progressData.springboot.overall,
        domains: [
          { ...pillars[1].domains[0], progress: progressData.springboot.core },
          { ...pillars[1].domains[1], progress: progressData.springboot.micro },
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
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Backend Development</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Master backend engineering with Java and Spring Boot ecosystems.
              </p>
            </div>
            <HubExportButton pillars={dynamicPillars} hubName="Backend" />
          </div>
        </div>

        <div className="space-y-3">
          {dynamicPillars.map((pillar) => (
            <RoadmapCardRow
              key={pillar.name}
              pillar={pillar}
              href={`/roadmaps/backend/${pillar.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
