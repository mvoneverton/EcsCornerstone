/**
 * Follow-up flag cron job.
 *
 * Finds paid assessment inquiries that have no participant count after 48 hours
 * and flags them for manual follow-up by the ECS team.
 *
 * Runs every 6 hours. Can be invoked two ways:
 *
 * 1. Standalone (Railway cron job):
 *    Command: node packages/api/dist/cron/followUpFlag.js
 *    Schedule: 0 *\/6 * * *  (every 6 hours)
 *    Configure in: Railway dashboard → New Service → Cron Job
 *
 * 2. In-process (set ENABLE_CRON=true in env):
 *    Called by src/index.ts on startup and then every 6 hours via setInterval.
 */
import 'dotenv/config';
import sgMail from '@sendgrid/mail';
import pool from '../db/client';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface FlaggedInquiry {
  id:           string;
  first_name:   string;
  last_name:    string;
  email:        string;
  company_name: string;
  visit_date:   Date | null;
  paid_at:      Date;
}

export async function runFollowUpFlagJob(): Promise<void> {
  console.log('[follow-up-flag] running job');

  // Find paid assessments with no participant count more than 48 hours after payment
  const { rows } = await pool.query<FlaggedInquiry>(
    `UPDATE assessment_inquiries
     SET follow_up_needed = true
     WHERE payment_status    = 'paid'
       AND participant_count IS NULL
       AND paid_at           < NOW() - INTERVAL '48 hours'
       AND follow_up_needed  = false
     RETURNING id, first_name, last_name, email, company_name, visit_date, paid_at`
  );

  if (rows.length === 0) {
    console.log('[follow-up-flag] no inquiries to flag');
    return;
  }

  console.log(`[follow-up-flag] flagging ${rows.length} inquiry/inquiries`);

  await sendFollowUpFlagNotification(rows);
}

async function sendFollowUpFlagNotification(inquiries: FlaggedInquiry[]): Promise<void> {
  const notifyEmail = process.env.ASSESSMENT_NOTIFY_EMAIL;

  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL || !notifyEmail) {
    console.warn('[follow-up-flag] email not configured — skipping notification');
    return;
  }

  const adminUrl   = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const plural     = inquiries.length === 1;

  const lines = [
    `${inquiries.length} assessment booking${plural ? '' : 's'} ${plural ? 'has' : 'have'} not submitted a participant count after 48+ hours.`,
    '',
    'ACTION NEEDED: Contact each client to confirm participant numbers.',
    '',
    ...inquiries.flatMap((inq) => {
      const visitStr = inq.visit_date
        ? inq.visit_date.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })
        : 'Visit date not yet booked';

      const paidStr = inq.paid_at.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      return [
        `─`.repeat(40),
        `Company:    ${inq.company_name}`,
        `Contact:    ${inq.first_name} ${inq.last_name} <${inq.email}>`,
        `Paid:       ${paidStr}`,
        `Visit date: ${visitStr}`,
        `Admin:      ${adminUrl}/admin/people`,
        '',
      ];
    }),
  ];

  await sgMail.send({
    to:      notifyEmail,
    from:    process.env.SENDGRID_FROM_EMAIL,
    subject: `Action needed — ${inquiries.length} assessment${plural ? '' : 's'} missing participant count`,
    text:    lines.join('\n'),
  }).catch((err: unknown) => console.error('[follow-up-flag] notification email failed', err));
}

// ── Standalone entry point ────────────────────────────────────────────────────
// Only runs when this file is executed directly (Railway cron or manual trigger).

async function main(): Promise<void> {
  try {
    await runFollowUpFlagJob();
  } catch (err) {
    console.error('[follow-up-flag] job failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// require.main === module is the CommonJS equivalent of "is this the entry point?"
if (require.main === module) {
  void main();
}
