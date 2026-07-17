'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

import { CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyAppear } from '@/components/shared/LazyAppear';



interface CategoryDisplay {
  slug: string;
  title: string;
  description: string;
  href: string;
  progress: number;
  hours: number;
  difficulty: string;
  topics: string[];
  storageKeys: string[];
  total: number;
}

const CATEGORY_DISPLAY: Omit<CategoryDisplay, 'progress'>[] = [
  {
    slug: 'foundation',
    title: 'Computer Science Foundation',
    description: 'Operating Systems, Computer Networks, and Database Management Systems. Critical core knowledge for every engineer.',
    href: '/roadmaps/foundation',
    hours: 255,
    difficulty: 'Medium-Hard',
    topics: ['Operating Systems', 'Computer Networks', 'DBMS'],
    storageKeys: ['foundation-os-completed', 'foundation-dbms-completed', 'foundation-cn-completed'],
    total: 150,
  },
  {
    slug: 'system-design',
    title: 'System Design & Architecture',
    description: 'Learn to architect highly scalable, reliable distributed systems.',
    href: '/roadmaps/system-design',
    hours: 250,
    difficulty: 'Hard',
    topics: ['System Design', 'Distributed Systems'],
    storageKeys: ['system-design-concepts-completed', 'system-design-problems-completed'],
    total: 100,
  },
  {
    slug: 'backend',
    title: 'Backend Development',
    description: 'Master enterprise application building using Java and the Spring Boot ecosystem.',
    href: '/roadmaps/backend',
    hours: 220,
    difficulty: 'Medium',
    topics: ['Java Core & JVM', 'Spring Boot & Microservices'],
    storageKeys: ['backend-java-completed', 'backend-springboot-completed'],
    total: 100,
  },
  {
    slug: 'frontend',
    title: 'Frontend Development',
    description: 'Deep dive into modern web user interfaces.',
    href: '/roadmaps/frontend',
    hours: 260,
    difficulty: 'Medium-Hard',
    topics: ['React Core', 'Next.js Framework', 'MicroFrontends'],
    storageKeys: ['frontend-react-completed', 'frontend-nextjs-completed', 'frontend-mfe-completed'],
    total: 150,
  },
  {
    slug: 'devops-cloud',
    title: 'DevOps & Cloud Engineering',
    description: 'Virtualization, container orchestration, and cloud infrastructure deployment.',
    href: '/roadmaps/devops-cloud',
    hours: 390,
    difficulty: 'Medium-Hard',
    topics: ['Docker & K8s', 'AWS Cloud Services', 'CI/CD Pipelines'],
    storageKeys: ['devops-cloud-docker-completed', 'devops-cloud-kubernetes-completed', 'devops-cloud-aws-completed', 'devops-cloud-devops-completed'],
    total: 200,
  },
  {
    slug: 'aptitude',
    title: 'Aptitude & Logical Reasoning',
    description: 'Master quantitative aptitude, logical reasoning, and data interpretation.',
    href: '/roadmaps/aptitude',
    hours: 120,
    difficulty: 'Easy-Medium',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation'],
    storageKeys: ['aptitude-completed'],
    total: 50,
  },
  {
    slug: 'databases',
    title: 'Database',
    description: 'Syllabus on relational SQL database design, 50 LeetCode query problems, and distributed NoSQL storage architectures.',
    href: '/roadmaps/databases',
    hours: 180,
    difficulty: 'Medium-Hard',
    topics: ['SQL Relational (50)', 'NoSQL Non-Relational (50)', 'LeetCode SQL (50)'],
    storageKeys: ['databases-sql-completed', 'databases-nosql-completed', 'completed-databases-leetcode'],
    total: 150,
  },
];

const difficultyColors: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Easy-Medium': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Medium-Hard': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Hard: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function RoadmapsPage() {
  const progressMap = React.useMemo(() => {
    const getCompletedCount = (storageKey: string, defaultVal: number = 0) => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return defaultVal;
        const data = JSON.parse(raw);
        return Object.keys(data).length;
      } catch {
        return defaultVal;
      }
    };

    const newProgress: Record<string, number> = {};
    CATEGORY_DISPLAY.forEach((cat) => {
      const totalCompleted = cat.storageKeys.reduce((sum, key) => sum + getCompletedCount(key), 0);
      newProgress[cat.slug] = Math.round((totalCompleted / cat.total) * 100);
    });
    return newProgress;
  }, []);

  const dynamicCategories: CategoryDisplay[] = React.useMemo(() => {
    return CATEGORY_DISPLAY.map((cat) => ({
      ...cat,
      progress: progressMap[cat.slug] ?? 0,
    }));
  }, [progressMap]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 space-y-6 md:space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Learning Roadmaps
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1.5 max-w-2xl">
            Structured learning paths designed to take you from fundamentals to advanced engineering concepts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dynamicCategories.map((category, index) => (
            <LazyAppear
              key={category.title}
              delay={index * 0.08}
              yOffset={15}
            >
              <Link href={category.href} className="group block">
                <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all duration-300 h-full hover:border-zinc-700/80">
                  <div className="flex flex-col justify-between h-full space-y-6">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors duration-200">
                          {category.title}
                        </h3>
                        <Badge variant="outline" className={cn('text-xs capitalize font-semibold border', difficultyColors[category.difficulty])}>
                          {category.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-zinc-400 leading-relaxed min-h-[72px]">
                        {category.description}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {category.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center rounded-md bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-zinc-400">Roadmap Progress</span>
                        <span className="text-xs font-bold text-zinc-200">{category.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${category.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </LazyAppear>
          ))}
        </div>
      </div>
    </div>
  );
}
