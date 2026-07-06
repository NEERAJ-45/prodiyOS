export type RoleOption = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'dsa';
export type HoursOption = '<1' | '1-2' | '2-4' | '4+';
export type ExperienceOption = 'beginner' | 'intermediate' | 'advanced';
export type ScheduleId = 'steady' | 'react' | 'java' | 'devops' | 'custom';

export interface InterestCategory {
  id: string;
  label: string;
  description: string;
  topics: string[];
  icon: string;
}

export interface OnboardingQuestion {
  step: number;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingQuestion[] = [
  { step: 1, title: 'What\'s Your Focus?', description: 'Choose the area you want to prioritise in your preparation.' },
  { step: 2, title: 'Study Time', description: 'How much time can you dedicate daily? This helps us pace your schedule.' },
  { step: 3, title: 'Experience Level', description: 'Where do you stand? We\'ll tailor the difficulty to match.' },
  { step: 4, title: 'Pick Your Interests', description: 'Select topics you want to focus on. We\'ll pre-fill your schedule with important ones.' },
  { step: 5, title: 'Your Schedule', description: 'Here\'s your personalised weekly plan. You can customise any slot below.' },
];

export const ROLE_OPTIONS: { id: RoleOption; label: string; icon: string; description: string; suggestedSchedule: ScheduleId }[] = [
  { id: 'frontend', label: 'Frontend', icon: 'Code2', description: 'React, Next.js, JavaScript, and UI engineering', suggestedSchedule: 'react' },
  { id: 'backend', label: 'Backend', icon: 'Server', description: 'Java, Spring Boot, APIs, and system architecture', suggestedSchedule: 'java' },
  { id: 'fullstack', label: 'Fullstack', icon: 'Layers', description: 'Both frontend and backend — the complete picture', suggestedSchedule: 'steady' },
  { id: 'devops', label: 'DevOps & Cloud', icon: 'Container', description: 'Docker, K8s, CI/CD, AWS, and system design', suggestedSchedule: 'devops' },
  { id: 'dsa', label: 'DSA & Interview Prep', icon: 'Brain', description: 'Data structures, algorithms, and coding interview prep', suggestedSchedule: 'steady' },
];

export const HOURS_OPTIONS: { id: HoursOption; label: string; slots: number }[] = [
  { id: '<1', label: 'Less than 1 hour', slots: 1 },
  { id: '1-2', label: '1–2 hours', slots: 2 },
  { id: '2-4', label: '2–4 hours', slots: 3 },
  { id: '4+', label: '4+ hours', slots: 3 },
];

export const EXPERIENCE_OPTIONS: { id: ExperienceOption; label: string; description: string }[] = [
  { id: 'beginner', label: 'Beginner', description: 'New to the field — starting from foundations' },
  { id: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics — levelling up' },
  { id: 'advanced', label: 'Advanced', description: 'Strong fundamentals — refining mastery' },
];

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'foundation',
    label: 'CS Foundations',
    description: 'Operating Systems, DBMS, Computer Networks',
    topics: ['OS', 'DBMS', 'Computer Networks'],
    icon: 'Cpu',
  },
  {
    id: 'system-design',
    label: 'System Design',
    description: 'LLD, HLD, Distributed Systems, Design Patterns',
    topics: ['System Design (LLD)', 'System Design (HLD)', 'Distributed Systems'],
    icon: 'GitBranch',
  },
  {
    id: 'frontend',
    label: 'Frontend Engineering',
    description: 'JavaScript, React, Next.js, MicroFrontends',
    topics: ['JavaScript', 'React', 'Next.js', 'MicroFrontends'],
    icon: 'Code2',
  },
  {
    id: 'backend',
    label: 'Backend Engineering',
    description: 'Java, Spring Boot, REST APIs, Microservices',
    topics: ['Java Core', 'Spring Boot', 'Microservices', 'REST APIs'],
    icon: 'Server',
  },
  {
    id: 'devops',
    label: 'DevOps & Cloud',
    description: 'Docker, Kubernetes, AWS, CI/CD',
    topics: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    icon: 'Container',
  },
  {
    id: 'databases',
    label: 'Databases',
    description: 'SQL, NoSQL, LeetCode SQL problems',
    topics: ['SQL', 'NoSQL', 'SQL LeetCode'],
    icon: 'Database',
  },
  {
    id: 'aptitude',
    label: 'Aptitude & Reasoning',
    description: 'Quantitative aptitude, logical reasoning, data interpretation',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation'],
    icon: 'Calculator',
  },
];

export function suggestScheduleForRole(roleId: RoleOption): ScheduleId {
  const option = ROLE_OPTIONS.find((r) => r.id === roleId);
  return option?.suggestedSchedule ?? 'steady';
}

export function generateScheduleDays(
  roleId: RoleOption,
  experience: ExperienceOption,
  hours: HoursOption,
  interests: string[],
): { day: string; slots: { period: string; topic: string; description: string }[] }[] {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseSchedule = ROLE_OPTIONS.find((r) => r.id === roleId)?.suggestedSchedule ?? 'steady';
  const slotCount = HOURS_OPTIONS.find((h) => h.id === hours)?.slots ?? 3;
  const isAdvanced = experience === 'advanced';

  const priorityTopics = interests.length > 0 ? interests : ['DSA', 'CS Fundamentals'];

  function pickTopic(dayIndex: number, slotIndex: number): string {
    const topicPool = [...priorityTopics];

    if (slotIndex === 0) {
      if (topicPool.includes('DSA') || baseSchedule === 'steady') {
        return 'DSA';
      }
      if (topicPool.includes('JavaScript') && ['react', 'frontend'].includes(baseSchedule)) {
        return 'JavaScript';
      }
      if (topicPool.includes('Java') && baseSchedule === 'java') {
        return 'Java Core';
      }
      return 'DSA';
    }

    if (slotIndex === 1) {
      const midTopics = topicPool.filter((t) => t !== 'DSA' && t !== 'CS Fundamentals');
      if (midTopics.length > 0) {
        return midTopics[dayIndex % midTopics.length];
      }
      if (baseSchedule === 'react') return 'React';
      if (baseSchedule === 'java') return 'Spring Boot';
      if (baseSchedule === 'devops') return 'System Design';
      return 'System Design';
    }

    if (slotIndex === 2) {
      const csTopics = topicPool.filter((t) => t === 'CS Fundamentals' || t === 'OS' || t === 'DBMS' || t === 'Computer Networks');
      if (csTopics.length > 0) {
        return csTopics[dayIndex % csTopics.length];
      }
      if (isAdvanced) {
        const advanced = ['System Design', 'Distributed Systems', 'Microservices', 'Kubernetes'];
        return advanced[dayIndex % advanced.length];
      }
      const fundamentals = ['OS', 'DBMS', 'Computer Networks', 'OOP'];
      return fundamentals[dayIndex % fundamentals.length];
    }

    return 'DSA';
  }

  const slots = slotCount === 1
    ? [{ period: 'Focus Session', topic: '', description: '1hr – Deep work block' }]
    : slotCount === 2
    ? [
        { period: 'M1 – DSA', topic: '', description: '1hr – Problem solving & patterns' },
        { period: 'M2', topic: '', description: '1hr – Core skills' },
      ]
    : [
        { period: 'M1 – DSA', topic: '', description: '1hr – Problem solving & patterns' },
        { period: 'M2', topic: '', description: '1hr – Core skills' },
        { period: 'Night – CS Fundamentals', topic: '', description: '1hr – Foundations & revision' },
      ];

  return DAYS.map((day, i) => ({
    day,
    slots: slots.map((s, j) => ({
      ...s,
      topic: pickTopic(i, j),
    })),
  }));
}
