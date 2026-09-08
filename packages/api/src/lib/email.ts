import sgMail from '@sendgrid/mail';

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
