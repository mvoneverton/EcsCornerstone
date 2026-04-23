import type { Request, Response } from 'express';
import sgMail from '@sendgrid/mail';
import pool from '../db/client';
import stripe from '../billing/stripe';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ── POST /api/scan/create-checkout-session ────────────────────────────────────

export async function createScanCheckoutSession(req: Request, res: Response): Promise<void> {
  const { inquiryId } = req.body as { inquiryId?: string };

  if (!inquiryId) {
    res.status(400).json({ error: 'inquiryId required' });
    return;
  }

  const { rows } = await pool.query<{
    id: string; first_name: string; last_name: string;
    email: string; company_name: string; payment_status: string;
  }>(
    `SELECT id, first_name, last_name, email, company_name, payment_status
     FROM scan_inquiries WHERE id = $1`,
    [inquiryId]
  );

  if (!rows.length) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }

  if (rows[0].payment_status === 'paid') {
    res.status(409).json({ error: 'Already paid' });
    return;
  }

  const inquiry = rows[0];
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: inquiry.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'ECS AI Scan' },
        unit_amount: 100000,
      },
      quantity: 1,
    }],
    metadata: {
      inquiryId,
      type: 'scan',
      customerName: `${inquiry.first_name} ${inquiry.last_name}`,
      companyName: inquiry.company_name,
    },
    success_url: `${frontendUrl}/scan/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${frontendUrl}/scan?cancelled=true`,
  });

  await pool.query(
    'UPDATE scan_inquiries SET stripe_session_id = $1 WHERE id = $2',
    [session.id, inquiryId]
  );

  res.status(201).json({ url: session.url });
}

// ── POST /api/assessment/create-checkout-session ──────────────────────────────

export async function createAssessmentCheckoutSession(req: Request, res: Response): Promise<void> {
  const { inquiryId } = req.body as { inquiryId?: string };

  if (!inquiryId) {
    res.status(400).json({ error: 'inquiryId required' });
    return;
  }

  const { rows } = await pool.query<{
    id: string; first_name: string; last_name: string;
    email: string; company_name: string; payment_status: string;
  }>(
    `SELECT id, first_name, last_name, email, company_name, payment_status
     FROM assessment_inquiries WHERE id = $1`,
    [inquiryId]
  );

  if (!rows.length) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }

  if (rows[0].payment_status === 'paid') {
    res.status(409).json({ error: 'Already paid' });
    return;
  }

  const inquiry = rows[0];
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: inquiry.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'ECS AI Assessment' },
        unit_amount: 150000,
      },
      quantity: 1,
    }],
    metadata: {
      inquiryId,
      type: 'assessment',
      customerName: `${inquiry.first_name} ${inquiry.last_name}`,
      companyName: inquiry.company_name,
    },
    success_url: `${frontendUrl}/assessment/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${frontendUrl}/assessment?cancelled=true`,
  });

  await pool.query(
    'UPDATE assessment_inquiries SET stripe_session_id = $1 WHERE id = $2',
    [session.id, inquiryId]
  );

  res.status(201).json({ url: session.url });
}

// ── GET /api/scan/verify-session?session_id= ─────────────────────────────────
// Verifies Stripe payment, atomically marks inquiry paid (first caller wins),
// sends receipt email exactly once, and returns inquiry data for the page.

export async function verifyScanSession(req: Request, res: Response): Promise<void> {
  const sessionId = req.query.session_id as string | undefined;

  if (!sessionId?.startsWith('cs_')) {
    res.status(400).json({ error: 'Invalid session_id' });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    res.status(402).json({ error: 'Payment not completed' });
    return;
  }

  const inquiryId = session.metadata?.inquiryId;
  if (!inquiryId) {
    res.status(400).json({ error: 'Missing inquiry metadata' });
    return;
  }

  // WHERE paid_at IS NULL ensures only the first caller marks paid and sends email
  const { rows: updated } = await pool.query<{
    first_name: string; email: string; company_name: string;
  }>(
    `UPDATE scan_inquiries
     SET payment_status          = 'paid',
         stripe_session_id       = $2,
         stripe_payment_intent_id = $3,
         paid_at                 = now()
     WHERE id = $1 AND paid_at IS NULL
     RETURNING first_name, email, company_name`,
    [inquiryId, sessionId, session.payment_intent as string | null]
  );

  if (updated.length > 0) {
    await sendScanReceiptEmail(updated[0], sessionId).catch(
      (err: unknown) => console.error('[booking] scan receipt email failed', err)
    );
  }

  const { rows } = await pool.query<{
    id: string; first_name: string; last_name: string;
    email: string; company_name: string;
  }>(
    'SELECT id, first_name, last_name, email, company_name FROM scan_inquiries WHERE id = $1',
    [inquiryId]
  );

  if (!rows.length) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }

  const inq = rows[0];
  res.json({
    inquiryId: inq.id,
    customerName: `${inq.first_name} ${inq.last_name}`,
    firstName:    inq.first_name,
    email:        inq.email,
    companyName:  inq.company_name,
    stripeSessionId: sessionId,
    amountPaid:   session.amount_total ?? 0,
  });
}

// ── GET /api/assessment/verify-session?session_id= ───────────────────────────

export async function verifyAssessmentSession(req: Request, res: Response): Promise<void> {
  const sessionId = req.query.session_id as string | undefined;

  if (!sessionId?.startsWith('cs_')) {
    res.status(400).json({ error: 'Invalid session_id' });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    res.status(402).json({ error: 'Payment not completed' });
    return;
  }

  const inquiryId = session.metadata?.inquiryId;
  if (!inquiryId) {
    res.status(400).json({ error: 'Missing inquiry metadata' });
    return;
  }

  const { rows: updated } = await pool.query<{
    first_name: string; email: string; company_name: string;
  }>(
    `UPDATE assessment_inquiries
     SET payment_status          = 'paid',
         stripe_session_id       = $2,
         stripe_payment_intent_id = $3,
         paid_at                 = now()
     WHERE id = $1 AND paid_at IS NULL
     RETURNING first_name, email, company_name`,
    [inquiryId, sessionId, session.payment_intent as string | null]
  );

  if (updated.length > 0) {
    await sendAssessmentReceiptEmail(updated[0], sessionId).catch(
      (err: unknown) => console.error('[booking] assessment receipt email failed', err)
    );
  }

  const { rows } = await pool.query<{
    id: string; first_name: string; last_name: string;
    email: string; company_name: string;
  }>(
    'SELECT id, first_name, last_name, email, company_name FROM assessment_inquiries WHERE id = $1',
    [inquiryId]
  );

  if (!rows.length) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }

  const inq = rows[0];
  res.json({
    inquiryId: inq.id,
    customerName: `${inq.first_name} ${inq.last_name}`,
    firstName:    inq.first_name,
    email:        inq.email,
    companyName:  inq.company_name,
    stripeSessionId: sessionId,
    amountPaid:   session.amount_total ?? 0,
  });
}

// ── Email 1 helpers ───────────────────────────────────────────────────────────

async function sendScanReceiptEmail(
  inq: { first_name: string; email: string; company_name: string },
  sessionId: string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  await sgMail.send({
    to:      inq.email,
    from:    process.env.SENDGRID_FROM_EMAIL,
    subject: `Your ECS AI Scan is confirmed — ${inq.company_name}`,
    text: [
      `Hi ${inq.first_name},`,
      '',
      'Your ECS AI Scan is confirmed and payment received.',
      '',
      'Receipt',
      '─'.repeat(35),
      `ECS AI Scan          $1,000`,
      `${inq.company_name} · ${date}`,
      `Confirmation #${sessionId}`,
      '─'.repeat(35),
      '',
      "Next: Schedule your Zoom call",
      "If you haven't already, book your call here:",
      `${frontendUrl}/scan/confirmation?session_id=${sessionId}`,
      '',
      'What happens on the call:',
      "We'll map your business operations, identify friction points, and pinpoint exactly where AI creates leverage.",
      '',
      'Within 48 hours of your call you will receive a custom PowerPoint report with your AI recommendations.',
      '',
      // [UPDATE] replace with real support email and founder name before launch
      'Questions? support@ecscornerstone.com',
      '— Marcus Everton',
      'Everton Consulting Services',
    ].join('\n'),
  });
}

async function sendAssessmentReceiptEmail(
  inq: { first_name: string; email: string; company_name: string },
  sessionId: string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  await sgMail.send({
    to:      inq.email,
    from:    process.env.SENDGRID_FROM_EMAIL,
    subject: `Your ECS AI Assessment is confirmed — ${inq.company_name}`,
    text: [
      `Hi ${inq.first_name},`,
      '',
      'Your ECS AI Assessment is confirmed and payment received.',
      '',
      'Receipt',
      '─'.repeat(35),
      `ECS AI Assessment        $1,500`,
      `${inq.company_name} · ${date}`,
      `Confirmation #${sessionId}`,
      '─'.repeat(35),
      '',
      "If you haven't chosen your visit date yet:",
      `${frontendUrl}/assessment/confirmation?session_id=${sessionId}`,
      '',
      "We'll follow up with your full pre-visit guide shortly.",
      '',
      // [UPDATE] replace with real support email and founder name before launch
      'Questions? support@ecscornerstone.com',
      '— Marcus Everton',
      'Everton Consulting Services',
    ].join('\n'),
  });
}
