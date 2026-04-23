import { z } from 'zod';

export const scanInquirySchema = z.object({
  firstName:      z.string().min(1, 'Required'),
  lastName:       z.string().min(1, 'Required'),
  companyName:    z.string().min(1, 'Required'),
  title:          z.string().min(1, 'Required'),
  email:          z.string().email('Valid email required'),
  phone:          z.string().min(1, 'Required'),
  companySize:    z.string().min(1, 'Required'),
  industry:       z.string().min(1, 'Required'),
  message:        z.string().min(10, 'Please provide more detail'),
  referralSource: z.string().optional(),
});

// assessment = renamed from audit
export const assessmentInquirySchema = z.object({
  firstName:       z.string().min(1, 'Required'),
  lastName:        z.string().min(1, 'Required'),
  companyName:     z.string().min(1, 'Required'),
  title:           z.string().min(1, 'Required'),
  email:           z.string().email('Valid email required'),
  phone:           z.string().min(1, 'Required'),
  companySize:     z.string().min(1, 'Required'),
  industry:        z.string().min(1, 'Required'),
  assessmentCount: z.string().min(1, 'Required'),
  message:         z.string().min(10, 'Please provide more detail'),
  referralSource:  z.string().optional(),
});

// Backwards compat alias for any code still referencing the old name
export const auditInquirySchema = assessmentInquirySchema;

export const fcaioInquirySchema = z.object({
  firstName:      z.string().min(1, 'Required'),
  lastName:       z.string().min(1, 'Required'),
  companyName:    z.string().min(1, 'Required'),
  title:          z.string().min(1, 'Required'),
  email:          z.string().email('Valid email required'),
  phone:          z.string().min(1, 'Required'),
  companySize:    z.string().min(1, 'Required'),
  industry:       z.string().min(1, 'Required'),
  message:        z.string().min(10, 'Please provide more detail'),
  referralSource: z.string().optional(),
});

export const waitlistSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  email:     z.string().email('Valid email required'),
});

export const checkoutSessionSchema = z.object({
  agentIds:    z.array(z.string().min(1)).min(1, 'At least one agent required'),
  firstName:   z.string().min(1, 'Required'),
  lastName:    z.string().min(1, 'Required'),
  email:       z.string().email('Valid email required'),
  companyName: z.string().min(1, 'Required'),
  industry:    z.string().min(1, 'Required'),
});
