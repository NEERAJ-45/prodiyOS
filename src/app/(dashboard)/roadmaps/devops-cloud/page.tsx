'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCardRow } from '@/components/roadmaps/RoadmapCardRow';
import { HubExportButton } from '@/components/roadmaps/HubExportButton';

const pillars = [
  {
    name: 'Docker',
    slug: 'docker',
    progress: 0,
    hours: 60,
    difficulty: 'Easy',
    domains: [
      { name: 'Container Basics', progress: 0 },
      { name: 'Orchestration & Compose', progress: 0 },
    ],
  },
  {
    name: 'Kubernetes',
    slug: 'kubernetes',
    progress: 0,
    hours: 100,
    difficulty: 'Hard',
    domains: [
      { name: 'Pods & Workloads', progress: 0 },
      { name: 'Networking & Services', progress: 0 },
    ],
  },
  {
    name: 'AWS',
    slug: 'aws',
    progress: 0,
    hours: 130,
    difficulty: 'Medium',
    domains: [
      { name: 'Compute & Storage', progress: 0 },
      { name: 'Networking & Security', progress: 0 },
    ],
  },
  {
    name: 'DevOps Essentials',
    slug: 'devops',
    progress: 0,
    hours: 100,
    difficulty: 'Medium',
    domains: [
      { name: 'CI/CD Pipelines', progress: 0 },
      { name: 'Monitoring & Logs', progress: 0 },
    ],
  },
];

function computeDevOpsCloudProgress() {
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

  const dockerOverall = getOverallCount('devops-cloud-docker');
  const dockerBasic = getCompletedCountInRange('devops-cloud-docker', 901, 930);
  const dockerCompose = getCompletedCountInRange('devops-cloud-docker', 931, 950);

  const k8sOverall = getOverallCount('devops-cloud-kubernetes');
  const k8sPods = getCompletedCountInRange('devops-cloud-kubernetes', 1001, 1030);
  const k8sNet = getCompletedCountInRange('devops-cloud-kubernetes', 1031, 1050);

  const awsOverall = getOverallCount('devops-cloud-aws');
  const awsCompute = getCompletedCountInRange('devops-cloud-aws', 1101, 1135);
  const awsNet = getCompletedCountInRange('devops-cloud-aws', 1136, 1150);

  const devopsOverall = getOverallCount('devops-cloud-devops');
  const devopsCicd = getCompletedCountInRange('devops-cloud-devops', 1201, 1230);
  const devopsMon = getCompletedCountInRange('devops-cloud-devops', 1231, 1250);

  return {
    docker: {
      overall: Math.round((dockerOverall / 50) * 100),
      basic: Math.round((dockerBasic / 30) * 100),
      compose: Math.round((dockerCompose / 20) * 100),
    },
    kubernetes: {
      overall: Math.round((k8sOverall / 50) * 100),
      pods: Math.round((k8sPods / 30) * 100),
      net: Math.round((k8sNet / 20) * 100),
    },
    aws: {
      overall: Math.round((awsOverall / 50) * 100),
      compute: Math.round((awsCompute / 35) * 100),
      net: Math.round((awsNet / 15) * 100),
    },
    devops: {
      overall: Math.round((devopsOverall / 50) * 100),
      cicd: Math.round((devopsCicd / 30) * 100),
      mon: Math.round((devopsMon / 20) * 100),
    }
  };
}

export default function DevOpsCloudRoadmapPage() {
  const [progressData, setProgressData] = React.useState(computeDevOpsCloudProgress);

  React.useEffect(() => {
    const update = () => setProgressData(computeDevOpsCloudProgress());
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
        progress: progressData.docker.overall,
        domains: [
          { ...pillars[0].domains[0], progress: progressData.docker.basic },
          { ...pillars[0].domains[1], progress: progressData.docker.compose },
        ]
      },
      {
        ...pillars[1],
        progress: progressData.kubernetes.overall,
        domains: [
          { ...pillars[1].domains[0], progress: progressData.kubernetes.pods },
          { ...pillars[1].domains[1], progress: progressData.kubernetes.net },
        ]
      },
      {
        ...pillars[2],
        progress: progressData.aws.overall,
        domains: [
          { ...pillars[2].domains[0], progress: progressData.aws.compute },
          { ...pillars[2].domains[1], progress: progressData.aws.net },
        ]
      },
      {
        ...pillars[3],
        progress: progressData.devops.overall,
        domains: [
          { ...pillars[3].domains[0], progress: progressData.devops.cicd },
          { ...pillars[3].domains[1], progress: progressData.devops.mon },
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
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">DevOps & Cloud</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Master virtualization, orchestration, cloud services, and automation pipelines.
              </p>
            </div>
            <HubExportButton pillars={dynamicPillars} hubName="DevOps Cloud" />
          </div>
        </div>

        <div className="space-y-3">
          {dynamicPillars.map((pillar) => (
            <RoadmapCardRow
              key={pillar.name}
              pillar={pillar}
              href={`/roadmaps/devops-cloud/${pillar.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
