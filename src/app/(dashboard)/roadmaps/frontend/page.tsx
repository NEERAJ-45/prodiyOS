'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCardRow } from '@/components/roadmaps/RoadmapCardRow';
import { HubExportButton } from '@/components/roadmaps/HubExportButton';

const pillars = [
  {
    name: 'JavaScript Fundamentals',
    slug: 'javascript',
    progress: 0,
    hours: 80,
    difficulty: 'Medium',
    domains: [
      { name: 'Core JS & Mechanics', progress: 0 },
      { name: 'Advanced & Async', progress: 0 },
    ],
  },
  {
    name: 'React',
    slug: 'react',
    progress: 0,
    hours: 90,
    difficulty: 'Medium',
    domains: [
      { name: 'Core React', progress: 0 },
      { name: 'Ecosystem & Next.js', progress: 0 },
    ],
  },
  {
    name: 'Next.js',
    slug: 'nextjs',
    progress: 0,
    hours: 90,
    difficulty: 'Medium-Hard',
    domains: [
      { name: 'Routing & Pages', progress: 0 },
      { name: 'Server & Rendering', progress: 0 },
    ],
  },
  {
    name: 'MicroFrontends',
    slug: 'microfrontends',
    progress: 0,
    hours: 80,
    difficulty: 'Hard',
    domains: [
      { name: 'Orchestration & Federation', progress: 0 },
      { name: 'Communication & Isolation', progress: 0 },
    ],
  },
  {
    name: 'Machine Coding',
    slug: 'machine-coding',
    progress: 0,
    hours: 100,
    difficulty: 'Medium-Hard',
    domains: [
      { name: 'Beginner Components', progress: 0 },
      { name: 'Intermediate & Advanced', progress: 0 },
    ],
  },
];

export default function FrontendRoadmapPage() {
  const [progressData, setProgressData] = React.useState({
    javascript: { overall: 0, core: 0, advanced: 0 },
    react: { overall: 0, core: 0, nextjs: 0 },
    nextjs: { overall: 0, routing: 0, rendering: 0 },
    mfe: { overall: 0, orchestration: 0, isolation: 0 },
    machineCoding: { overall: 0, beginner: 0, advanced: 0 }
  });

  React.useEffect(() => {
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

    const jsOverall = getOverallCount('frontend-javascript');
    const jsCore = getCompletedCountInRange('frontend-javascript', 701, 746);
    const jsAdvanced = getCompletedCountInRange('frontend-javascript', 747, 773);

    const reactOverall = getOverallCount('frontend-react');
    const reactCore = getCompletedCountInRange('frontend-react', 801, 830);
    const reactNextjs = getCompletedCountInRange('frontend-react', 831, 850);

    const nextjsOverall = getOverallCount('frontend-nextjs');
    const nextjsRouting = getCompletedCountInRange('frontend-nextjs', 851, 875);
    const nextjsRendering = getCompletedCountInRange('frontend-nextjs', 876, 900);

    const mfeOverall = getOverallCount('frontend-mfe');
    const mfeOrchestration = getCompletedCountInRange('frontend-mfe', 901, 925);
    const mfeIsolation = getCompletedCountInRange('frontend-mfe', 926, 950);

    const mcOverall = getOverallCount('frontend-machine-coding');
    const mcBeginner = getCompletedCountInRange('frontend-machine-coding', 951, 960);
    const mcAdvanced = getCompletedCountInRange('frontend-machine-coding', 961, 1000);

    setProgressData({
      javascript: {
        overall: Math.round((jsOverall / 73) * 100),
        core: Math.round((jsCore / 46) * 100),
        advanced: Math.round((jsAdvanced / 27) * 100),
      },
      react: {
        overall: Math.round((reactOverall / 50) * 100),
        core: Math.round((reactCore / 30) * 100),
        nextjs: Math.round((reactNextjs / 20) * 100),
      },
      nextjs: {
        overall: Math.round((nextjsOverall / 50) * 100),
        routing: Math.round((nextjsRouting / 25) * 100),
        rendering: Math.round((nextjsRendering / 25) * 100),
      },
      mfe: {
        overall: Math.round((mfeOverall / 50) * 100),
        orchestration: Math.round((mfeOrchestration / 25) * 100),
        isolation: Math.round((mfeIsolation / 25) * 100),
      },
      machineCoding: {
        overall: Math.round((mcOverall / 50) * 100),
        beginner: Math.round((mcBeginner / 10) * 100),
        advanced: Math.round((mcAdvanced / 40) * 100),
      }
    });
  }, []);

  const dynamicPillars = React.useMemo(() => {
    return [
      {
        ...pillars[0],
        progress: progressData.javascript.overall,
        domains: [
          { ...pillars[0].domains[0], progress: progressData.javascript.core },
          { ...pillars[0].domains[1], progress: progressData.javascript.advanced },
        ]
      },
      {
        ...pillars[1],
        progress: progressData.react.overall,
        domains: [
          { ...pillars[1].domains[0], progress: progressData.react.core },
          { ...pillars[1].domains[1], progress: progressData.react.nextjs },
        ]
      },
      {
        ...pillars[2],
        progress: progressData.nextjs.overall,
        domains: [
          { ...pillars[2].domains[0], progress: progressData.nextjs.routing },
          { ...pillars[2].domains[1], progress: progressData.nextjs.rendering },
        ]
      },
      {
        ...pillars[3],
        progress: progressData.mfe.overall,
        domains: [
          { ...pillars[3].domains[0], progress: progressData.mfe.orchestration },
          { ...pillars[3].domains[1], progress: progressData.mfe.isolation },
        ]
      },
      {
        ...pillars[4],
        progress: progressData.machineCoding.overall,
        domains: [
          { ...pillars[4].domains[0], progress: progressData.machineCoding.beginner },
          { ...pillars[4].domains[1], progress: progressData.machineCoding.advanced },
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
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Frontend Development</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Build responsive, interactive, and modular user interfaces with React, Next.js, MicroFrontends, and Machine Coding practice.
              </p>
            </div>
            <HubExportButton pillars={dynamicPillars} hubName="Frontend" />
          </div>
        </div>

        <div className="space-y-3">
          {dynamicPillars.map((pillar) => (
            <RoadmapCardRow
              key={pillar.name}
              pillar={pillar}
              href={`/roadmaps/frontend/${pillar.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
