import { z } from 'zod';

export const statusEnum = z.enum([
  'APPLIED', 'PHONE_SCREEN', 'TECH_ROUND_1', 'TECH_ROUND_2',
  'SYSTEM_DESIGN', 'HR_CULTURE', 'OFFER', 'REJECTED',
]);

export const sourceEnum = z.enum(['LINKEDIN', 'COMPANY_WEBSITE', 'REFERRAL', 'RECRUITER', 'OTHER']);

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const applicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  appliedDate: z.string().min(1, 'Applied date is required'),
  status: statusEnum,
  source: sourceEnum,
  priority: priorityEnum,
  notes: z.string().optional(),
  nextRoundDate: z.string().optional(),
});

export const interviewRoundSchema = z.object({
  applicationId: z.string().min(1),
  roundType: statusEnum,
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  selfRating: z.number().min(1).max(5).optional(),
});

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  compRange: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  contacts: z.array(z.object({
    name: z.string().optional(),
    role: z.string().optional(),
    email: z.string().optional(),
    linkedin: z.string().optional(),
  })).optional(),
  whyInterested: z.string().optional(),
  notes: z.string().optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
export type InterviewRoundFormData = z.infer<typeof interviewRoundSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;
