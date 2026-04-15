import { z } from 'zod';

export const inviteSchema = z.object({
  email:          z.string().email(),
  firstName:      z.string().min(1).max(50),
  lastName:       z.string().min(1).max(50),
  assessmentType: z.enum(['pca', 'wsa', 'ja']),
  positionId:     z.string().uuid().optional(),  // required when assessmentType = 'ja'
  currentPosition: z.string().max(100).optional(),
}).superRefine((data, ctx) => {
  if (data.assessmentType === 'ja' && !data.positionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['positionId'],
      message: 'positionId is required for Job Assessments',
    });
  }
});

export const listPeopleSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role:   z.enum(['company_admin', 'facilitator', 'respondent']).optional(),
});

export const updatePersonSchema = z.object({
  firstName:          z.string().min(1).max(50).optional(),
  lastName:           z.string().min(1).max(50).optional(),
  currentPosition:    z.string().max(100).optional(),
  role:               z.enum(['company_admin', 'facilitator', 'respondent']).optional(),
  facilitatorNotes:   z.string().max(2000).optional(),
});

export type InviteInput       = z.infer<typeof inviteSchema>;
export type ListPeopleInput   = z.infer<typeof listPeopleSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
