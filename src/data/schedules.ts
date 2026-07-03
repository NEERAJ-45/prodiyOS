export type ScheduleId = 'steady' | 'react' | 'java' | 'devops';

export interface Slot {
  period: 'M1 – DSA' | 'M2' | 'Night – CS Fundamentals';
  topic: string;
  description?: string;
}

export interface DaySchedule {
  day: string;
  slots: Slot[];
}

export interface StudySchedule {
  id: ScheduleId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  days: DaySchedule[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function day(day: string, m2: string, night: string, m1Desc?: string, m2Desc?: string, nightDesc?: string): DaySchedule {
  return {
    day,
    slots: [
      { period: 'M1 – DSA', topic: m1Desc ?? 'DSA', description: '1hr – Problem solving & patterns' },
      { period: 'M2', topic: m2, description: m2Desc ?? '1hr' },
      { period: 'Night – CS Fundamentals', topic: night, description: nightDesc ?? '1hr' },
    ],
  };
}

export const SCHEDULES: Record<ScheduleId, StudySchedule> = {
  steady: {
    id: 'steady',
    label: 'Steady (Default)',
    shortLabel: 'Steady',
    icon: 'Brain',
    description: 'General DSA + CS Fundamentals grind. Default track.',
    days: [
      day('Mon', 'Spring', 'OS'),
      day('Tue', 'React Machine Coding', 'DBMS'),
      day('Wed', 'Spring', 'Networks'),
      day('Thu', 'React Machine Coding', 'OOP'),
      day('Fri', 'System Design', 'OS/DBMS (weak areas)'),
      day('Sat', 'Docker/K8s', 'Networks/OOP (weak areas)', 'DSA (harder problems)'),
      day('Sun', 'Catch-up / weakest track', 'CS Revise', 'DSA (revise)'),
    ],
  },
  react: {
    id: 'react',
    label: 'React Dev Track',
    shortLabel: 'React',
    icon: 'Code2',
    description: 'React-focused prep. Use when React role is lined up.',
    days: [
      day('Mon', 'React Machine Coding — building block', 'JS Fundamentals'),
      day('Tue', 'React Machine Coding — building block', 'Networks (HTTP/REST/APIs)'),
      day('Wed', 'React Machine Coding — building block', 'JS Fundamentals'),
      day('Thu', 'React Machine Coding — building block', 'OOP'),
      day('Fri', 'React — timed build (45-60min)', 'JS Fundamentals'),
      day('Sat', 'React — timed build (45-60min)', 'OS/Networks (weak)', 'DSA (harder problems)'),
      day('Sun', 'React catch-up / rebuild a weak component', 'CS Revise', 'DSA (revise)'),
    ],
  },
  java: {
    id: 'java',
    label: 'Java Dev Track',
    shortLabel: 'Java',
    icon: 'Coffee',
    description: 'Java/Backend-focused prep. Use when Java/Spring role is lined up.',
    days: [
      day('Mon', 'Spring (book, ch-wise)', 'OOP (Java-specific: SOLID, patterns)'),
      day('Tue', 'Spring', 'DBMS'),
      day('Wed', 'Spring', 'OS'),
      day('Thu', 'Spring', 'Networks'),
      day('Fri', 'Java core (collections, streams, multithreading)', 'OOP'),
      day('Sat', 'Spring — bigger chunk / mini CRUD project', 'DBMS/OS (weak)', 'DSA (harder problems)'),
      day('Sun', 'Spring catch-up', 'CS Revise', 'DSA (revise)'),
    ],
  },
  devops: {
    id: 'devops',
    label: 'DevOps + SD Track',
    shortLabel: 'DevOps',
    icon: 'Container',
    description: 'DevOps, Docker/K8s & System Design. Use when SD-heavy role is lined up.',
    days: [
      day('Mon', 'System Design (LLD)', 'Networks'),
      day('Tue', 'Docker (images, Dockerfile, Compose)', 'OS'),
      day('Wed', 'System Design (LLD)', 'Networks'),
      day('Thu', 'Kubernetes (pods, deployments, services)', 'OS'),
      day('Fri', 'System Design (HLD: caching, LB, sharding)', 'DBMS'),
      day('Sat', 'System Design — case study', 'DBMS/Networks (weak)', 'DSA (harder problems)'),
      day('Sun', 'Docker/K8s catch-up', 'CS Revise', 'DSA (revise)'),
    ],
  },
};

export const SCHEDULE_IDS: ScheduleId[] = ['steady', 'react', 'java', 'devops'];

export function getTodaySchedule(scheduleId: ScheduleId): DaySchedule | null {
  const schedule = SCHEDULES[scheduleId];
  if (!schedule) return null;
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  return schedule.days.find((d) => d.day === dayName) ?? null;
}

export function getDaySchedule(scheduleId: ScheduleId, dayName: string): DaySchedule | null {
  const schedule = SCHEDULES[scheduleId];
  if (!schedule) return null;
  return schedule.days.find((d) => d.day === dayName) ?? null;
}

export function getScheduleDays(scheduleId: ScheduleId): DaySchedule[] {
  return SCHEDULES[scheduleId]?.days ?? [];
}

export const DAY_NAMES = DAYS;
