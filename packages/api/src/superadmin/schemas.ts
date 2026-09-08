import { z } from 'zod';

export const updatePlanSchema = z.object({
  planId: z.string().uuid(),
});

// 'canceled' — single-L, matches Stripe's own subscription.status values
// and what billing/webhooks.ts already writes to this column.
export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete']),
});

export const gatedPathSchema = z.object({
  path: z.enum(['agent_placement', 'fcaio']),
});

export type UpdatePlanInput              = z.infer<typeof updatePlanSchema>;
export type UpdateSubscriptionStatusInput = z.infer<typeof updateSubscriptionStatusSchema>;
export type GatedPathInput               = z.infer<typeof gatedPathSchema>;
