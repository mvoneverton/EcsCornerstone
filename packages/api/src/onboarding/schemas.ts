import { z } from 'zod';

export const registerSchema = z.object({
  companyName:     z.string().min(2).max(100),
  adminFirstName:  z.string().min(1).max(50),
  adminLastName:   z.string().min(1).max(50),
  email:           z.string().email(),
  password:        z.string().min(8).max(128),
  planId:          z.string().uuid(),
  billingCycle:    z.enum(['monthly', 'annually']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
