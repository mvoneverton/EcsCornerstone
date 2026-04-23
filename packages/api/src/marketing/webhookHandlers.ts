import type { Request, Response } from 'express';
import crypto from 'crypto';
import type Stripe from 'stripe';
import sgMail from '@sendgrid/mail';
import pool from '../db/client';
import stripe from '../billing/stripe';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ── Calendly payload types ────────────────────────────────────────────────────

interface CalendlyInvitee {
  name:     string;
  email:    string;
  timezone: string;
}

interface CalendlyEventLocation {
  join_url?: string;
  type:      string;
}

interface CalendlyScheduledEvent {
  uri:        string;
  start_time: string;
  end_time:   string;
  location?:  CalendlyEventLocation;
}

interface CalendlyWebhookPayload {
  event:   string;
  payload: {
    invitee:       CalendlyInvitee;
    event:         CalendlyScheduledEvent;
    cancel_url?:   string;
    reschedule_url?: string;
  };
}

// ── POST /api/webhooks/stripe ─────────────────────────────────────────────────
// Backup path: verify-session is the primary payment marker.
// This webhook ensures the DB is marked paid even if the user closes the browser
// before hitting the confirmation page.
// Register in Stripe dashboard with event: checkout.session.completed
// Use env var STRIPE_BOOKING_WEBHOOK_SECRET (separate from billing webhook secret).

export async function handleStripeBookingWebhook(req: Request, res: Response): Promise<void> {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_BOOKING_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[booking-webhook] STRIPE_BOOKING_WEBHOOK_SECRET not set');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`[booking-webhook] signature verification failed: ${msg}`);
    res.status(400).json({ error: `Webhook Error: ${msg}` });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session   = event.data.object as Stripe.Checkout.Session;
    const type      = session.metadata?.type;
    const inquiryId = session.metadata?.inquiryId;

    if (!inquiryId) {
      res.json({ received: true });
      return;
    }

    const table = type === 'scan' ? 'scan_inquiries'
                : type === 'assessment' ? 'assessment_inquiries'
                : null;

    if (table) {
      await pool.query(
        `UPDATE ${table}
         SET payment_status          = 'paid',
             stripe_session_id       = $2,
             stripe_payment_intent_id = $3,
             paid_at                 = now()
         WHERE id = $1 AND paid_at IS NULL`,
        [inquiryId, session.id, session.payment_intent as string | null]
      ).catch((err: unknown) => console.error(`[booking-webhook] DB update failed for ${table}`, err));
    }
  }

  res.json({ received: true });
}

// ── POST /api/webhooks/calendly ───────────────────────────────────────────────
// Matches invitee email to paid inquiries, records the scheduled date,
// and sends Email 2 (call confirmed for Scan, pre-visit guide for Assessment).
// Register in Calendly dashboard with events: invitee.created, invitee.canceled
// Body is raw Buffer (express.raw mounted in index.ts before express.json).

export async function handleCalendlyWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = (req.body as Buffer).toString('utf8');

  // Verify Calendly webhook signature
  const sigHeader = req.headers['calendly-webhook-signature'] as string | undefined;
  const secret    = process.env.CALENDLY_WEBHOOK_SECRET;

  if (secret && sigHeader) {
    const parts     = sigHeader.split(',');
    const tPart     = parts.find((p) => p.startsWith('t='));
    const v1Part    = parts.find((p) => p.startsWith('v1='));
    const timestamp = tPart?.slice(2);
    const signature = v1Part?.slice(3);

    if (timestamp && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      const sigBuf  = Buffer.from(signature, 'hex');
      const expBuf  = Buffer.from(expected,  'hex');

      if (sigBuf.length !== expBuf.length ||
          !crypto.timingSafeEqual(sigBuf, expBuf)) {
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
    }
  }

  let payload: CalendlyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as CalendlyWebhookPayload;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const eventType = payload.event;
  const invitee   = payload.payload?.invitee;
  const schedEvent = payload.payload?.event;

  if (!invitee?.email) {
    res.json({ received: true });
    return;
  }

  const email     = invitee.email;
  const eventUri  = schedEvent?.uri ?? null;
  const startTime = schedEvent?.start_time ? new Date(schedEvent.start_time) : null;
  const zoomUrl   = schedEvent?.location?.join_url ?? null;

  if (eventType === 'invitee.created' && startTime) {
    // Try scan first
    const { rows: scanRows } = await pool.query<{
      id: string; first_name: string; email: string; company_name: string;
    }>(
      `UPDATE scan_inquiries
       SET zoom_call_date    = $2,
           calendly_event_uri = $3
       WHERE email = $1
         AND payment_status  = 'paid'
         AND zoom_call_date IS NULL
       RETURNING id, first_name, email, company_name`,
      [email, startTime, eventUri]
    );

    if (scanRows.length > 0) {
      await sendScanCallConfirmedEmail(scanRows[0], startTime, invitee, zoomUrl).catch(
        (err: unknown) => console.error('[calendly-webhook] scan call confirmed email failed', err)
      );
      res.json({ received: true });
      return;
    }

    // Try assessment
    const { rows: assessRows } = await pool.query<{
      id: string; first_name: string; email: string; company_name: string;
    }>(
      `UPDATE assessment_inquiries
       SET visit_date         = $2,
           calendly_event_uri = $3
       WHERE email = $1
         AND payment_status   = 'paid'
         AND visit_date IS NULL
       RETURNING id, first_name, email, company_name`,
      [email, startTime, eventUri]
    );

    if (assessRows.length > 0) {
      const token = await generateAndStoreParticipantToken(assessRows[0].id);
      await sendAssessmentPrevisitEmail(assessRows[0], startTime, invitee, token).catch(
        (err: unknown) => console.error('[calendly-webhook] assessment pre-visit email failed', err)
      );
    }
  } else if (eventType === 'invitee.canceled' && eventUri) {
    await pool.query(
      `UPDATE scan_inquiries
       SET zoom_call_date = NULL, calendly_event_uri = NULL
       WHERE email = $1 AND calendly_event_uri = $2`,
      [email, eventUri]
    );
    await pool.query(
      `UPDATE assessment_inquiries
       SET visit_date = NULL, calendly_event_uri = NULL
       WHERE email = $1 AND calendly_event_uri = $2`,
      [email, eventUri]
    );
  }

  res.json({ received: true });
}

// ── Token generation ──────────────────────────────────────────────────────────

export async function generateAndStoreParticipantToken(inquiryId: string): Promise<string> {
  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await pool.query(
    'UPDATE assessment_inquiries SET participant_count_token_hash = $1 WHERE id = $2',
    [tokenHash, inquiryId]
  );

  return rawToken;
}

// ── Email 2 — Scan: call confirmed ───────────────────────────────────────────

async function sendScanCallConfirmedEmail(
  inq:      { first_name: string; email: string; company_name: string },
  date:     Date,
  invitee:  CalendlyInvitee,
  zoomUrl:  string | null
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const dayStr  = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: invitee.timezone,
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    timeZone: invitee.timezone,
  });

  await sgMail.send({
    to:      inq.email,
    from:    process.env.SENDGRID_FROM_EMAIL,
    subject: `Your Zoom call is scheduled — ${dayStr}`,
    text: [
      `Hi ${inq.first_name},`,
      '',
      'Your ECS AI Scan call is scheduled.',
      '',
      `Date:   ${dayStr}`,
      `Time:   ${timeStr}`,
      `Format: Zoom`,
      zoomUrl ? `Link:   ${zoomUrl}` : 'Link:   A Zoom link will be sent by Calendly.',
      '',
      'What to bring:',
      '• A sense of your biggest operational pain points',
      '• Context on your team size and current tools',
      '• No formal preparation required',
      '',
      'After the call:',
      'Your custom AI recommendation report arrives within 48 hours via email.',
      '',
      'See you then.',
      // [UPDATE] replace with real founder name before launch
      '— Marcus Everton',
      'Everton Consulting Services',
    ].join('\n'),
  });
}

// ── Email 2 — Assessment: pre-visit guide ─────────────────────────────────────

async function sendAssessmentPrevisitEmail(
  inq:     { id: string; first_name: string; email: string; company_name: string },
  date:    Date,
  invitee: CalendlyInvitee,
  token:   string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const apiUrl      = process.env.API_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:4000';
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  const dayStr = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: invitee.timezone,
  });

  const formAction  = `${apiUrl}/api/assessment/participant-count`;
  const fallbackUrl = `${frontendUrl}/assessment/participant-count?id=${inq.id}&token=${token}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }
    h2   { color: #0A1E3D; font-size: 20px; margin-top: 32px; margin-bottom: 8px; }
    hr   { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
    .receipt { background: #f9f9f9; padding: 16px; border-radius: 4px; font-family: monospace; }
    .profile { margin: 8px 0; }
    .profile strong { display: inline-block; width: 100px; }
    .form-section { background: #fffbf0; border: 1px solid #D4AF37; border-radius: 4px; padding: 20px; margin: 24px 0; }
    input[type=number] { padding: 8px 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px; width: 160px; }
    button { margin-left: 8px; padding: 8px 20px; background: #D4AF37; color: #0A1E3D; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: 600; }
    .fallback { font-size: 13px; color: #666; margin-top: 8px; }
  </style>
</head>
<body>
  <p>Hi ${inq.first_name},</p>
  <p>Your ECS AI Assessment is scheduled for <strong>${dayStr}</strong>. Here's everything you need to know.</p>

  <hr />

  <div class="receipt">
    <strong>YOUR VISIT</strong><br />
    Date:&nbsp;&nbsp;&nbsp;&nbsp; ${dayStr}<br />
    Location: Your office<br />
    Duration: Full day
  </div>

  <h2>WHAT HAPPENS ON THE DAY</h2>

  <p><strong>Morning — Discovery Session</strong><br />
  We map your workflows, identify friction points, and score every AI opportunity by impact and effort. Come ready to talk about where things slow down, where errors happen, and where your team spends time they shouldn't.</p>

  <p><strong>Mid-day — ECS Cornerstone Assessment</strong><br />
  Your team completes the ECS Cornerstone behavioral assessment — three short instruments that profile how your people communicate, make decisions, and work under pressure. Approximately 15–20 minutes per person, completed individually on any device.</p>

  <p><strong>Afternoon — Training &amp; Findings</strong><br />
  We walk your team through their Cornerstone results — what profiles mean, how to read a colleague's profile, and how to use this to communicate more effectively. We close with your preliminary AI findings and a preview of your implementation roadmap.</p>

  <hr />

  <h2>WHAT IS ECS CORNERSTONE?</h2>

  <p>ECS Cornerstone profiles your team along two dimensions — Assertiveness and Responsiveness — resulting in one of four communication profiles:</p>

  <div class="profile"><strong>Vanguard</strong> — Direct, decisive, results-driven</div>
  <div class="profile"><strong>Catalyst</strong> — Energetic, persuasive, people-focused</div>
  <div class="profile"><strong>Cultivator</strong> — Warm, patient, relationship-oriented</div>
  <div class="profile"><strong>Architect</strong> — Precise, analytical, detail-driven</div>

  <p>Every AI agent we recommend is configured using your team's Cornerstone profiles — so your agents communicate the right way with every person in your organization.</p>

  <hr />

  <div class="form-section">
    <h2 style="margin-top:0;">ONE QUESTION FOR YOU</h2>
    <p>How many team members will be completing the Cornerstone assessment on the day of your visit? (Include yourself in the count.)</p>
    <form action="${formAction}" method="POST">
      <input type="hidden" name="inquiryId" value="${inq.id}" />
      <input type="hidden" name="token"     value="${token}" />
      <input type="number" name="count" min="1" max="500" placeholder="Number of participants" required />
      <button type="submit">Submit</button>
    </form>
    <p class="fallback">If the button above doesn't work, <a href="${fallbackUrl}">click here to submit on our website</a>.</p>
  </div>

  <hr />

  <h2>WHAT TO PREPARE</h2>
  <ul>
    <li>No formal preparation required</li>
    <li>Think about your biggest pain points before the morning</li>
    <li>Have your team available for ~2 hours mid-day</li>
    <li>A laptop or tablet per participant is ideal</li>
  </ul>

  <p>See you on ${dayStr}.</p>

  <p>
    — Marcus Everton<br /><!-- [UPDATE] replace with real founder name -->
    Everton Consulting Services<br />
    <!-- [UPDATE] add phone number and support email -->
  </p>
</body>
</html>`.trim();

  const textBody = [
    `Hi ${inq.first_name},`,
    '',
    `Your ECS AI Assessment is scheduled for ${dayStr}.`,
    "Here's everything you need to know.",
    '',
    'YOUR VISIT',
    '─'.repeat(38),
    `Date:     ${dayStr}`,
    'Location: Your office',
    'Duration: Full day',
    '─'.repeat(38),
    '',
    'WHAT HAPPENS ON THE DAY',
    '',
    'Morning — Discovery Session',
    "We map your workflows, identify friction points, and score every AI opportunity by impact and effort.",
    '',
    'Mid-day — ECS Cornerstone Assessment',
    "Your team completes the ECS Cornerstone behavioral assessment. Approximately 15–20 minutes per person.",
    '',
    'Afternoon — Training & Findings',
    "We walk your team through their Cornerstone results and close with your preliminary AI findings.",
    '',
    'WHAT IS ECS CORNERSTONE?',
    '',
    'ECS Cornerstone profiles your team along two dimensions — Assertiveness and Responsiveness:',
    '  Vanguard   — Direct, decisive, results-driven',
    '  Catalyst   — Energetic, persuasive, people-focused',
    '  Cultivator — Warm, patient, relationship-oriented',
    '  Architect  — Precise, analytical, detail-driven',
    '',
    'ONE QUESTION FOR YOU',
    '',
    'How many team members will be completing the Cornerstone assessment on the day of your visit?',
    '(Include yourself in the count.)',
    '',
    `Submit here: ${fallbackUrl}`,
    '',
    'WHAT TO PREPARE',
    '• No formal preparation required',
    '• Think about your biggest pain points before the morning',
    '• Have your team available for ~2 hours mid-day',
    '• A laptop or tablet per participant is ideal',
    '',
    `See you on ${dayStr}.`,
    '',
    '— Marcus Everton', // [UPDATE] replace with real founder name
    'Everton Consulting Services',
  ].join('\n');

  await sgMail.send({
    to:      inq.email,
    from:    process.env.SENDGRID_FROM_EMAIL!,
    subject: `Everything you need to know before your ECS AI Assessment`,
    text:    textBody,
    html:    htmlBody,
  });
}
