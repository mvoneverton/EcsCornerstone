import type { Request, Response } from 'express';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import pool from '../db/client';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function timingSafeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// ── POST /api/assessment/participant-count ────────────────────────────────────

export async function submitParticipantCount(req: Request, res: Response): Promise<void> {
  const { inquiryId, token, count } = req.body as {
    inquiryId?: string; token?: string; count?: unknown;
  };

  if (!inquiryId || !token || count === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const parsed = parseInt(String(count), 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 500) {
    res.status(400).json({ error: 'Count must be between 1 and 500' });
    return;
  }

  const { rows } = await pool.query<{
    id: string; first_name: string; last_name: string; email: string;
    company_name: string; visit_date: Date | null;
    participant_count: number | null;
    participant_count_token_hash: string | null;
  }>(
    `SELECT id, first_name, last_name, email, company_name, visit_date,
            participant_count, participant_count_token_hash
     FROM assessment_inquiries WHERE id = $1`,
    [inquiryId]
  );

  if (!rows.length || !rows[0].participant_count_token_hash) {
    res.status(403).json({ error: 'Invalid request' });
    return;
  }

  const inq       = rows[0];
  const submitted = hashToken(token);

  if (!timingSafeCompareHex(submitted, inq.participant_count_token_hash)) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  if (inq.participant_count !== null) {
    res.json({ success: true, alreadySubmitted: true, count: inq.participant_count });
    return;
  }

  await pool.query(
    `UPDATE assessment_inquiries
     SET participant_count = $1, participant_count_received_at = now()
     WHERE id = $2`,
    [parsed, inquiryId]
  );

  await sendParticipantCountNotification(inq, parsed).catch(
    (err: unknown) => console.error('[participant] notify email failed', err)
  );

  res.json({ success: true });
}

// ── GET /api/assessment/participant-count?id=&token= ─────────────────────────
// Used by the fallback web page — validates the token and returns
// company info so the page can render a meaningful form.

export async function getParticipantCountPage(req: Request, res: Response): Promise<void> {
  const { id, token } = req.query as { id?: string; token?: string };

  if (!id || !token) {
    res.status(400).json({ error: 'Missing id or token' });
    return;
  }

  const { rows } = await pool.query<{
    id: string; first_name: string; company_name: string;
    visit_date: Date | null; participant_count: number | null;
    participant_count_token_hash: string | null;
  }>(
    `SELECT id, first_name, company_name, visit_date, participant_count,
            participant_count_token_hash
     FROM assessment_inquiries WHERE id = $1`,
    [id]
  );

  if (!rows.length || !rows[0].participant_count_token_hash) {
    res.status(403).json({ error: 'Invalid request' });
    return;
  }

  const inq       = rows[0];
  const submitted = hashToken(token);

  if (!timingSafeCompareHex(submitted, inq.participant_count_token_hash)) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  res.json({
    inquiryId:        inq.id,
    firstName:        inq.first_name,
    companyName:      inq.company_name,
    visitDate:        inq.visit_date,
    alreadySubmitted: inq.participant_count !== null,
    currentCount:     inq.participant_count,
  });
}

// ── Internal: notify ECS team ─────────────────────────────────────────────────

async function sendParticipantCountNotification(
  inq:   { first_name: string; last_name: string; email: string; company_name: string; visit_date: Date | null },
  count: number
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return;

  const notifyEmail = process.env.ASSESSMENT_NOTIFY_EMAIL;
  if (!notifyEmail) return;

  const visitStr = inq.visit_date
    ? inq.visit_date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Not yet scheduled';

  await sgMail.send({
    to:      notifyEmail,
    from:    process.env.SENDGRID_FROM_EMAIL,
    subject: `${inq.company_name} — ${count} participant${count === 1 ? '' : 's'} confirmed`,
    text: [
      `Participant count confirmed for assessment booking.`,
      '',
      `Company:     ${inq.company_name}`,
      `Contact:     ${inq.first_name} ${inq.last_name} <${inq.email}>`,
      `Participants: ${count}`,
      `Visit date:  ${visitStr}`,
    ].join('\n'),
  });
}
