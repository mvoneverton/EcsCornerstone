import { z } from 'zod';

// ── Save a single response ────────────────────────────────────────────────────

export const pcaResponseSchema = z.object({
  questionNumber: z.number().int().min(1).max(24),
  responseMost:   z.number().int().min(1).max(96),
  responseLeast:  z.number().int().min(1).max(96),
}).refine((d) => d.responseMost !== d.responseLeast, {
  message: 'Most and Least selections must be different words',
  path: ['responseLeast'],
});

export const wsaJaResponseSchema = z.object({
  questionNumber: z.number().int().min(1).max(32),
  responseValue:  z.number().int().min(1).max(5),
});

// Union — discriminated on which fields are present
export const saveResponseSchema = z.union([
  pcaResponseSchema,
  wsaJaResponseSchema,
]);

export type PcaResponseInput   = z.infer<typeof pcaResponseSchema>;
export type WsaJaResponseInput = z.infer<typeof wsaJaResponseSchema>;
export type SaveResponseInput  = z.infer<typeof saveResponseSchema>;
