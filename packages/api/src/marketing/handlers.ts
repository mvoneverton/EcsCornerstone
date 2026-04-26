import type { Request, Response } from 'express';
import sgMail from '@sendgrid/mail';
import pool from '../db/client';
import stripe from '../billing/stripe';
import {
  scanInquirySchema,
  assessmentInquirySchema,
  auditInquirySchema,
  fcaioInquirySchema,
  waitlistSchema,
  checkoutSessionSchema,
} from './schemas';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// SendGrid is used only for FCAIO and waitlist flows.
// Scan and assessment inquiry notifications are handled via EmailJS on the frontend.

// ── POST /api/scan/inquiry ────────────────────────────────────────────────────

export async function createScanInquiry(req: Request, res: Response): Promise<void> {
  const parsed = scanInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const d = parsed.data;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO scan_inquiries
       (first_name, last_name, company_name, title, email, phone,
        company_size, industry, message, referral_source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [d.firstName, d.lastName, d.companyName, d.title, d.email, d.phone,
     d.companySize, d.industry, d.message, d.referralSource ?? null],
  );

  const inquiryId = rows[0].id;

  res.status(201).json({ success: true, inquiryId });
}

// ── POST /api/assessment/inquiry ──────────────────────────────────────────────

export async function createAssessmentInquiry(req: Request, res: Response): Promise<void> {
  const parsed = assessmentInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const d = parsed.data;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO assessment_inquiries
       (first_name, last_name, company_name, title, email, phone,
        company_size, industry, assessment_count, message, referral_source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [d.firstName, d.lastName, d.companyName, d.title, d.email, d.phone,
     d.companySize, d.industry, d.assessmentCount, d.message, d.referralSource ?? null],
  );

  const inquiryId = rows[0].id;

  res.status(201).json({ success: true, inquiryId });
}

// ── POST /api/audit/inquiry ─── (301 redirect handled in router) ──────────────

export async function createAuditInquiry(req: Request, res: Response): Promise<void> {
  const parsed = auditInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const d = parsed.data;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO assessment_inquiries
       (first_name, last_name, company_name, title, email, phone,
        company_size, industry, assessment_count, message, referral_source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [d.firstName, d.lastName, d.companyName, d.title, d.email, d.phone,
     d.companySize, d.industry, d.assessmentCount, d.message, d.referralSource ?? null],
  );

  const inquiryId = rows[0].id;

  // Send emails only when SendGrid is configured
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    const from = process.env.SENDGRID_FROM_EMAIL;

    // Confirmation to prospect
    await sgMail.send({
      to: d.email,
      from,
      subject: 'We received your ECS AI Audit request',
      text: [
        `Hi ${d.firstName},`,
        '',
        "Thank you for reaching out. We've received your ECS AI Audit request and will be in touch within 1 business day to confirm your date and provide a custom quote.",
        '',
        `Company: ${d.companyName}`,
        `Company size: ${d.companySize}`,
        '',
        'Looking forward to speaking with you.',
        '',
        'The ECS Team',
        'Everton Consulting Services',
      ].join('\n'),
    }).catch((err: unknown) => console.error('[marketing] confirmation email failed', err));

    // Notification to ECS team
    const notifyEmail = process.env.ASSESSMENT_NOTIFY_EMAIL ?? process.env.AUDIT_NOTIFY_EMAIL;
    if (notifyEmail) {
      await sgMail.send({
        to: notifyEmail,
        from,
        subject: `New Assessment Inquiry — ${d.companyName}`,
        text: [
          `New assessment inquiry received (ID: ${inquiryId})`,
          '',
          `Name:        ${d.firstName} ${d.lastName}`,
          `Title:       ${d.title}`,
          `Company:     ${d.companyName}`,
          `Email:       ${d.email}`,
          `Phone:       ${d.phone}`,
          `Size:        ${d.companySize}`,
          `Industry:    ${d.industry}`,
          `Assessment:  ${d.assessmentCount} employees`,
          `Referral:    ${d.referralSource ?? 'not specified'}`,
          '',
          'Message:',
          d.message,
        ].join('\n'),
      }).catch((err: unknown) => console.error('[marketing] notify email failed', err));
    }
  }

  res.status(201).json({ success: true, inquiryId });
}

// ── POST /api/fcaio/inquiry ───────────────────────────────────────────────────

export async function createFcaioInquiry(req: Request, res: Response): Promise<void> {
  const parsed = fcaioInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const d = parsed.data;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO fcaio_inquiries
       (first_name, last_name, company_name, title, email, phone,
        company_size, industry, message, referral_source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [d.firstName, d.lastName, d.companyName, d.title, d.email, d.phone,
     d.companySize, d.industry, d.message, d.referralSource ?? null],
  );

  const inquiryId = rows[0].id;

  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    const from = process.env.SENDGRID_FROM_EMAIL;

    await sgMail.send({
      to: d.email,
      from,
      subject: 'We received your FCAIO inquiry',
      text: [
        `Hi ${d.firstName},`,
        '',
        "Thank you for reaching out about the Fractional Chief AI Officer engagement. We'll be in touch within 1 business day to schedule a discovery call.",
        '',
        'The ECS Team',
        'Everton Consulting Services',
      ].join('\n'),
    }).catch((err: unknown) => console.error('[marketing] FCAIO confirmation email failed', err));

    const notifyEmail = process.env.FCAIO_NOTIFY_EMAIL; // [UPDATE] set in Railway env vars
    if (notifyEmail) {
      await sgMail.send({
        to: notifyEmail,
        from,
        subject: `New FCAIO Inquiry — ${d.companyName}`,
        text: [
          `New FCAIO inquiry (ID: ${inquiryId})`,
          '',
          `Name:     ${d.firstName} ${d.lastName}`,
          `Title:    ${d.title}`,
          `Company:  ${d.companyName}`,
          `Email:    ${d.email}`,
          `Phone:    ${d.phone}`,
          `Size:     ${d.companySize}`,
          `Industry: ${d.industry}`,
          `Referral: ${d.referralSource ?? 'not specified'}`,
          '',
          'Message:',
          d.message,
        ].join('\n'),
      }).catch((err: unknown) => console.error('[marketing] FCAIO notify email failed', err));
    }
  }

  res.status(201).json({ success: true, inquiryId });
}

// ── POST /api/waitlist ────────────────────────────────────────────────────────

export async function joinWaitlist(req: Request, res: Response): Promise<void> {
  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const { firstName, email } = parsed.data;

  // Upsert — silently succeed if already on the list
  await pool.query(
    `INSERT INTO cornerstone_waitlist (first_name, email)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [firstName, email],
  );

  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    const from = process.env.SENDGRID_FROM_EMAIL;

    await sgMail.send({
      to: email,
      from,
      subject: "You're on the ECS Cornerstone waitlist",
      text: [
        `Hi ${firstName},`,
        '',
        "You're on the list. We'll reach out as soon as ECS Cornerstone is available as a standalone platform.",
        '',
        'In the meantime, Cornerstone is available as part of the ECS AI Assessment.',
        'Learn more: https://ecscornerstone.com/cornerstone',
        '',
        'The ECS Team',
      ].join('\n'),
    }).catch((err: unknown) => console.error('[marketing] waitlist confirmation email failed', err));

    const notifyEmail = process.env.WAITLIST_NOTIFY_EMAIL ?? 'Michael@evertonconsultingservices.org';
    await sgMail.send({
      to: notifyEmail,
      from,
      subject: 'New Cornerstone Waitlist Signup',
      text: [
        'New waitlist signup:',
        '',
        `Name:  ${firstName}`,
        `Email: ${email}`,
      ].join('\n'),
    }).catch((err: unknown) => console.error('[marketing] waitlist notify email failed', err));
  }

  res.status(201).json({ success: true });
}

// ── POST /api/stripe/create-checkout-session ──────────────────────────────────

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const parsed = checkoutSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const { agentIds, firstName, lastName, email, companyName, industry } = parsed.data;

  // [UPDATE] replace test keys with live keys before production
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3002';

  const session = await stripe.checkout.sessions.create({
    mode:           'payment',
    customer_email: email,
    line_items: agentIds.map((id) => ({
      price_data: {
        currency:     'usd',
        unit_amount:  1000, // $10 per agent — reservation fee applied to first month
        product_data: {
          name:        `ECS Agent Reservation — ${id}`,
          description: 'Reservation fee applied directly to your first month.',
        },
      },
      quantity: 1,
    })),
    metadata: {
      agentIds:    agentIds.join(','),
      customerName: `${firstName} ${lastName}`,
      companyName,
      industry,
    },
    success_url: `${frontendUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${frontendUrl}/reserve?cancelled=true`,
  });

  res.status(201).json({ url: session.url });
}

// ── GET /api/stripe/session/:sessionId ───────────────────────────────────────

export async function getCheckoutSession(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.params as { sessionId: string };

  if (!sessionId || !sessionId.startsWith('cs_')) {
    res.status(400).json({ error: 'Invalid session ID' });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    res.status(402).json({ error: 'Payment not completed' });
    return;
  }

  const meta = session.metadata ?? {};

  res.json({
    agentIds:     (meta.agentIds ?? '').split(',').filter(Boolean),
    customerName: meta.customerName ?? '',
    companyName:  meta.companyName ?? '',
    amountPaid:   session.amount_total ?? 0, // cents
  });
}
