import sgMail from '@sendgrid/mail';
import type { PFProfile } from '../people-first/profileMapping';
import { pfProfileTextMap } from '../people-first/pfProfileTextMap';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@evertoncs.com',
  name:  process.env.SENDGRID_FROM_NAME  ?? 'ECS Cornerstone',
};

const TAGLINE = 'Automate the ordinary. Honor the individual.';

interface WelcomeEmailParams {
  toEmail:         string;
  adminFirstName:  string;
  companyName:     string;
  planName:        string;
  /** Monthly assessment limit, or null/"Unlimited" for uncapped plans. */
  assessmentLimit: number | string | null;
}

/**
 * Sent to a new company_admin once their subscription activates
 * (billing/webhooks.ts → handleCheckoutSessionCompleted).
 *
 * Falls back to a console log when SendGrid is not configured, matching the
 * behaviour of auth/email.ts.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { toEmail, adminFirstName, companyName, planName, assessmentLimit } = params;

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const loginUrl = `${frontendUrl}/login`;
  const limitText =
    assessmentLimit === null || assessmentLimit === undefined ? 'Unlimited' : String(assessmentLimit);

  const subject = "Welcome to ECS Cornerstone — let's get you set up";

  const text = [
    `Hi ${adminFirstName},`,
    '',
    `Welcome to ECS Cornerstone. Your account for ${companyName} is now active.`,
    '',
    "Here's how to get started in three steps:",
    '',
    '1. Add your first position',
    '   Log in and go to Positions → Create Position to describe the role you\'re assessing for.',
    '',
    '2. Send your first assessment',
    '   Go to Campaigns → New Campaign, select your position, add your team\'s email addresses, and send.',
    '',
    '3. Review results',
    '   As your team completes assessments, results appear in your dashboard with full profile reports ready to download.',
    '',
    `Your plan: ${planName}`,
    `Assessments included: ${limitText} per month`,
    '',
    `Log in here: ${loginUrl}`,
    '',
    'Questions? Reply to this email or contact michael@evertonconsultingservices.org',
    '',
    '— Mike',
    'Everton Consulting Services',
    `"${TAGLINE}"`,
  ].join('\n');

  const html = `
    <p>Hi ${adminFirstName},</p>
    <p>Welcome to ECS Cornerstone. Your account for <strong>${companyName}</strong> is now active.</p>
    <p>Here's how to get started in three steps:</p>
    <ol>
      <li><strong>Add your first position</strong><br/>
        Log in and go to Positions &rarr; Create Position to describe the role you're assessing for.</li>
      <li><strong>Send your first assessment</strong><br/>
        Go to Campaigns &rarr; New Campaign, select your position, add your team's email addresses, and send.</li>
      <li><strong>Review results</strong><br/>
        As your team completes assessments, results appear in your dashboard with full profile reports ready to download.</li>
    </ol>
    <p>
      Your plan: <strong>${planName}</strong><br/>
      Assessments included: <strong>${limitText}</strong> per month
    </p>
    <p><a href="${loginUrl}">Log in here</a></p>
    <p>Questions? Reply to this email or contact
      <a href="mailto:michael@evertonconsultingservices.org">michael@evertonconsultingservices.org</a></p>
    <p>&mdash; Mike<br/>Everton Consulting Services<br/><em>"${TAGLINE}"</em></p>
  `;

  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[email] Welcome email for ${toEmail} (${companyName}) — SendGrid not configured, skipping send`);
    return;
  }

  await sgMail.send({ to: toEmail, from: FROM, subject, text, html });
}

// ── People First emails ───────────────────────────────────────────────────────

const PF_TAGLINE  = 'Better relationships start with understanding.';
const PF_FOOTER   = 'People First | Powered by the ECS Cornerstone Assessment';
const PF_CONTACT  = 'michael@evertonconsultingservices.org';

export async function sendPFInvitationEmail(
  to: string,
  firstName: string,
  token: string,
  eventName: string,
  eventDate: Date | null,
  isFree: boolean
): Promise<void> {
  const pfUrl       = process.env.PF_URL ?? 'http://localhost:5174';
  const assessUrl   = `${pfUrl}/assess/${token}`;
  const subject     = `You're invited — ${eventName}`;

  const dateLine = eventDate
    ? `Join us on ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} for your People First session where we'll bring your results to life.\n\n`
    : '';

  const freeLine = isFree ? 'This event is complimentary — no payment required.\n\n' : '';

  const text = [
    `Hi ${firstName},`,
    '',
    `Michael has invited you to take the People First Assessment ahead of ${eventName}.`,
    '',
    'The assessment takes about 15–20 minutes and will help you better understand your natural communication style in relationships and family life.',
    '',
    `Take Your Assessment → ${assessUrl}`,
    '',
    dateLine + freeLine + `Questions? Contact ${PF_CONTACT}`,
    '',
    '— Mike',
    PF_FOOTER,
    `"${PF_TAGLINE}"`,
  ].join('\n');

  const html = `
    <p>Hi ${firstName},</p>
    <p>Michael has invited you to take the People First Assessment ahead of <strong>${eventName}</strong>.</p>
    <p>The assessment takes about 15–20 minutes and will help you better understand your natural communication style in relationships and family life.</p>
    <p><a href="${assessUrl}" style="display:inline-block;background:#1A3A5C;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Take Your Assessment &rarr;</a></p>
    ${eventDate ? `<p>Join us on <strong>${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> for your People First session where we'll bring your results to life.</p>` : ''}
    ${isFree ? '<p>This event is complimentary — no payment required.</p>' : ''}
    <p>Questions? Contact <a href="mailto:${PF_CONTACT}">${PF_CONTACT}</a></p>
    <p>&mdash; Mike<br/>${PF_FOOTER}<br/><em>"${PF_TAGLINE}"</em></p>
  `;

  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[pf-email] Invitation for ${to} (${eventName}) — SendGrid not configured, skipping send`);
    console.log(`[pf-email] Assessment URL: ${assessUrl}`);
    return;
  }

  await sgMail.send({ to, from: FROM, subject, text, html });
}

export async function sendPFResultsEmail(
  to: string,
  firstName: string,
  primaryProfile: PFProfile,
  eventName: string
): Promise<void> {
  const profileText = pfProfileTextMap[primaryProfile];
  const profileName = primaryProfile.charAt(0).toUpperCase() + primaryProfile.slice(1);
  const subject     = `Your People First results are here, ${firstName}`;

  const text = [
    `Hi ${firstName},`,
    '',
    'Your People First Assessment results are in.',
    '',
    `YOUR PROFILE: ${profileName.toUpperCase()}`,
    profileText.tagline,
    '',
    profileText.briefDescription,
    '',
    'HOW OTHERS SEE YOU',
    profileText.howOthersSeeYou,
    '',
    '---',
    profileText.eventTeaser,
    '',
    'See you soon,',
    'Mike',
    PF_FOOTER,
    `"${PF_TAGLINE}"`,
  ].join('\n');

  const html = `
    <p>Hi ${firstName},</p>
    <p>Your People First Assessment results are in.</p>
    <h2 style="font-size:1.5rem;color:#1A3A5C;">YOUR PROFILE: ${profileName.toUpperCase()}</h2>
    <p style="color:#8B9DB8;font-style:italic;">${profileText.tagline}</p>
    <p>${profileText.briefDescription}</p>
    <h3 style="color:#1A3A5C;">HOW OTHERS SEE YOU</h3>
    <p>${profileText.howOthersSeeYou}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p>${profileText.eventTeaser}</p>
    <p>See you soon,<br/><strong>Mike</strong><br/>${PF_FOOTER}<br/><em>"${PF_TAGLINE}"</em></p>
  `;

  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[pf-email] Results email for ${to} (${eventName}, profile: ${primaryProfile}) — SendGrid not configured, skipping send`);
    return;
  }

  await sgMail.send({ to, from: FROM, subject, text, html });
}
