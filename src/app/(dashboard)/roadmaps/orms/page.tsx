'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCardRow } from '@/components/roadmaps/RoadmapCardRow';

const pillars = [
  {
    name: 'Hibernate (JPA)',
    slug: 'hibernate',
    progress: 0,
    hours: 100,
    difficulty: 'Medium-Hard',
    domains: [
      { name: 'Fundamentals', progress: 0 },
      { name: 'Mappings & Associations', progress: 0 },
      { name: 'Querying', progress: 0 },
      { name: 'Performance & Caching', progress: 0 },
      { name: 'Advanced & Production', progress: 0 },
    ],
  },
  {
    name: 'Prisma',
    slug: 'prisma',
    progress: 0,
    hours: 100,
    difficulty: 'Medium',
    domains: [
      { name: 'Setup & Schema', progress: 0 },
      { name: 'Relations', progress: 0 },
      { name: 'Querying', progress: 0 },
      { name: 'Migrations & Advanced', progress: 0 },
      { name: 'Production & Ecosystem', progress: 0 },
    ],
  },
  {
    name: 'Drizzle',
    slug: 'drizzle',
    progress: 0,
    hours: 100,
    difficulty: 'Hard',
    domains: [
      { name: 'Setup & Schema', progress: 0 },
      { name: 'Queries', progress: 0 },
      { name: 'Relations & Joins', progress: 0 },
      { name: 'Migrations & Types', progress: 0 },
      { name: 'Advanced & Production', progress: 0 },
    ],
  },
];

export default function OrmsRoadmapPage() {
  const [progressData, setProgressData] = React.useState({
    hibernate: { overall: 0, fundamentals: 0, mappings: 0, querying: 0, performance: 0, advanced: 0 },
    prisma: { overall: 0, setup: 0, relations: 0, querying: 0, migrations: 0, ecosystem: 0 },
    drizzle: { overall: 0, setup: 0, queries: 0, joins: 0, migrations: 0, advanced: 0 },
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

    const hibernateOverall = getOverallCount('orms-hibernate');
    const hibernateFundamentals = getCompletedCountInRange('orms-hibernate', 1001, 1010);
    const hibernateMappings = getCompletedCountInRange('orms-hibernate', 1011, 1020);
    const hibernateQuerying = getCompletedCountInRange('orms-hibernate', 1021, 1030);
    const hibernatePerformance = getCompletedCountInRange('orms-hibernate', 1031, 1040);
    const hibernateAdvanced = getCompletedCountInRange('orms-hibernate', 1041, 1050);

    const prismaOverall = getOverallCount('orms-prisma');
    const prismaSetup = getCompletedCountInRange('orms-prisma', 1051, 1060);
    const prismaRelations = getCompletedCountInRange('orms-prisma', 1061, 1070);
    const prismaQuerying = getCompletedCountInRange('orms-prisma', 1071, 1080);
    const prismaMigrations = getCompletedCountInRange('orms-prisma', 1081, 1090);
    const prismaEcosystem = getCompletedCountInRange('orms-prisma', 1091, 1100);

    const drizzleOverall = getOverallCount('orms-drizzle');
    const drizzleSetup = getCompletedCountInRange('orms-drizzle', 1101, 1110);
    const drizzleQueries = getCompletedCountInRange('orms-drizzle', 1111, 1120);
    const drizzleJoins = getCompletedCountInRange('orms-drizzle', 1121, 1130);
    const drizzleMigrations = getCompletedCountInRange('orms-drizzle', 1131, 1140);
    const drizzleAdvanced = getCompletedCountInRange('orms-drizzle', 1141, 1150);

    setProgressData({
      hibernate: {
        overall: Math.round((hibernateOverall / 50) * 100),
        fundamentals: Math.round((hibernateFundamentals / 10) * 100),
        mappings: Math.round((hibernateMappings / 10) * 100),
        querying: Math.round((hibernateQuerying / 10) * 100),
        performance: Math.round((hibernatePerformance / 10) * 100),
        advanced: Math.round((hibernateAdvanced / 10) * 100),
      },
      prisma: {
        overall: Math.round((prismaOverall / 50) * 100),
        setup: Math.round((prismaSetup / 10) * 100),
        relations: Math.round((prismaRelations / 10) * 100),
        querying: Math.round((prismaQuerying / 10) * 100),
        migrations: Math.round((prismaMigrations / 10) * 100),
        ecosystem: Math.round((prismaEcosystem / 10) * 100),
      },
      drizzle: {
        overall: Math.round((drizzleOverall / 50) * 100),
        setup: Math.round((drizzleSetup / 10) * 100),
        queries: Math.round((drizzleQueries / 10) * 100),
        joins: Math.round((drizzleJoins / 10) * 100),
        migrations: Math.round((drizzleMigrations / 10) * 100),
        advanced: Math.round((drizzleAdvanced / 10) * 100),
      },
    });
  }, []);

  const dynamicPillars = React.useMemo(() => {
    return [
      {
        ...pillars[0],
        progress: progressData.hibernate.overall,
        domains: [
          { ...pillars[0].domains[0], progress: progressData.hibernate.fundamentals },
          { ...pillars[0].domains[1], progress: progressData.hibernate.mappings },
          { ...pillars[0].domains[2], progress: progressData.hibernate.querying },
          { ...pillars[0].domains[3], progress: progressData.hibernate.performance },
          { ...pillars[0].domains[4], progress: progressData.hibernate.advanced },
        ]
      },
      {
        ...pillars[1],
        progress: progressData.prisma.overall,
        domains: [
          { ...pillars[1].domains[0], progress: progressData.prisma.setup },
          { ...pillars[1].domains[1], progress: progressData.prisma.relations },
          { ...pillars[1].domains[2], progress: progressData.prisma.querying },
          { ...pillars[1].domains[3], progress: progressData.prisma.migrations },
          { ...pillars[1].domains[4], progress: progressData.prisma.ecosystem },
        ]
      },
      {
        ...pillars[2],
        progress: progressData.drizzle.overall,
        domains: [
          { ...pillars[2].domains[0], progress: progressData.drizzle.setup },
          { ...pillars[2].domains[1], progress: progressData.drizzle.queries },
          { ...pillars[2].domains[2], progress: progressData.drizzle.joins },
          { ...pillars[2].domains[3], progress: progressData.drizzle.migrations },
          { ...pillars[2].domains[4], progress: progressData.drizzle.advanced },
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">ORMs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Master object-relational mapping across three paradigms: Java Hibernate (JPA), TypeScript Prisma (schema-first), and Drizzle (SQL-first).
          </p>
        </div>

        <div className="space-y-3">
          {dynamicPillars.map((pillar) => (
            <RoadmapCardRow
              key={pillar.name}
              pillar={pillar}
              href={`/roadmaps/orms/${pillar.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
