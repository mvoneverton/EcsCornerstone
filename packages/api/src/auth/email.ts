import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@evertoncs.com',
  name:  process.env.SENDGRID_FROM_NAME  ?? 'ECS Cornerstone',
};

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${resetToken}`;

  if (!process.env.SENDGRID_API_KEY) {
    // Dev mode — log instead of sending
    console.log(`[email] Password reset link for ${toEmail}: ${link}`);
    return;
  }

  await sgMail.send({
    to:      toEmail,
    from:    FROM,
    subject: 'Reset your ECS Cornerstone password',
    html: `
      <p>You requested a password reset for your ECS Cornerstone account.</p>
      <p><a href="${link}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
    `,
    text: `Reset your password: ${link}\n\nThis link expires in 1 hour.`,
  });
}

export async function sendInvitationEmail(
  toEmail: string,
  inviterName: string,
  assessmentToken: string,
  assessmentType: string
): Promise<void> {
  const link = `${APP_URL}/assess/${assessmentToken}`;
  const typeLabel =
    assessmentType === 'pca' ? 'Personal Communication Assessment'
    : assessmentType === 'wsa' ? 'Work Style Assessment'
    : 'Job Assessment';

  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[email] Assessment invitation for ${toEmail}: ${link}`);
    return;
  }

  await sgMail.send({
    to:      toEmail,
    from:    FROM,
    subject: `You've been invited to complete a ${typeLabel}`,
    html: `
      <p>${inviterName} has invited you to complete a <strong>${typeLabel}</strong>.</p>
      <p><a href="${link}">Begin your assessment</a></p>
      <p>This link is unique to you and will expire in 7 days.</p>
    `,
    text: `${inviterName} invited you to complete a ${typeLabel}.\n\nBegin here: ${link}`,
  });
}
