import type { IResumeScores } from '@/lib/models/ResumeAnalysis';

export type AtsAction = 'analyze' | 'optimize' | 'humanize';

export interface HumanizePattern {
  section: string;
  pattern: string;
  before: string;
  after: string;
}

export interface AtsAnalysis {
  atsScore: number;
  matchScore: number;
  missingKeywords: string[];
  presentKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AtsResult {
  action: AtsAction;
  scores: IResumeScores;
  missingKeywords: string[];
  presentKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  optimizedSource?: string | null;
  patternsFound?: HumanizePattern[];
}

export interface AtsRunInput {
  resume: string;
  jobDescription: string;
  roleTitle?: string | null;
  action: AtsAction;
}
