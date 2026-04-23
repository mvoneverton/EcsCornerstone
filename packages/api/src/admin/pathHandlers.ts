import type { Request, Response } from 'express';
import sgMail from '@sendgrid/mail';
import { z } from 'zod';
import pool from '../db/client';
import { generatePathToken, hashToken, validatePathToken } from '../middleware/clientPathToken';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const unlockPathSchema = z.object({
  paths: z.array(z.enum(['agents', 'fcaio'])).min(1, 'Select at least one path'),
});

// ── POST /api/admin/clients/:id/unlock-path ───────────────────────────────────

export async function unlockClientPath(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  const parsed = unlockPathSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    return;
  }

  const { paths } = parsed.data;

  // Fetch the client
  const { rows: userRows } = await pool.query<{
    id: string; email: string; first_name: string; last_name: string; company_name: string;
  }>(
    `SELECT u.id, u.email, u.first_name, u.last_name, c.name AS company_name
     FROM users u
     JOIN companies c ON c.id = u.company_id
     WHERE u.id = $1`,
    [id],
  );

  if (!userRows.length) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const client = userRows[0];

  // Update unlocked_paths (merge with existing)
  await pool.query(
    `UPDATE users
     SET unlocked_paths = (
       SELECT array_agg(DISTINCT p) FROM unnest(unlocked_paths || $2::text[]) AS p
     )
     WHERE id = $1`,
    [id, paths],
  );

  // Generate signed token (30-day expiry)
  const rawToken = generatePathToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO path_tokens (user_id, token_hash, paths, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, tokenHash, paths, expiresAt],
  );

  // Update email sent timestamp
  await pool.query(
    `UPDATE users SET path_email_sent_at = now() WHERE id = $1`,
    [id],
  );

  // Send path email
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://ecscornerstone.com';
    const from = process.env.SENDGRID_FROM_EMAIL;

    const hasAgents = paths.includes('agents');
    const hasFcaio  = paths.includes('fcaio');

    let subject = 'Your ECS recommendation is ready';
    let body: string;

    if (hasAgents && hasFcaio) {
      body = [
        `Hi ${client.first_name},`,
        '',
        'Based on your ECS Assessment findings, we have two recommended paths for your business.',
        'Click below to explore your options.',
        '',
        `Agent Deployment: ${frontendUrl}/agents?token=${rawToken}`,
        `Full Transformation (FCAIO): ${frontendUrl}/fcaio?token=${rawToken}`,
        '',
        'The ECS Team',
        'Everton Consulting Services',
      ].join('\n');
    } else if (hasAgents) {
      body = [
        `Hi ${client.first_name},`,
        '',
        "Based on our Assessment findings, here's what we recommend as your next step.",
        'Click below to explore the AI agents we\'ve selected for your business.',
        '',
        `View My Recommendations: ${frontendUrl}/agents?token=${rawToken}`,
        '',
        'The ECS Team',
        'Everton Consulting Services',
      ].join('\n');
    } else {
      body = [
        `Hi ${client.first_name},`,
        '',
        `Based on our Assessment findings, we believe a full organizational AI transformation is the right path for ${client.company_name}.`,
        'Here\'s what that looks like.',
        '',
        `View My Path: ${frontendUrl}/fcaio?token=${rawToken}`,
        '',
        'The ECS Team',
        'Everton Consulting Services',
      ].join('\n');
    }

    await sgMail.send({
      to: client.email,
      from,
      subject,
      text: body,
    }).catch((err: unknown) => console.error('[admin] path email failed', err));
  }

  res.status(200).json({ success: true, token: rawToken, expiresAt });
}

// ── GET /api/validate-path-token/:token ──────────────────────────────────────

export async function validateToken(req: Request, res: Response): Promise<void> {
  const { token } = req.params as { token: string };

  const payload = await validatePathToken(token);

  if (!payload) {
    res.status(200).json({ valid: false });
    return;
  }

  res.status(200).json({ valid: true, paths: payload.paths, clientId: payload.clientId });
}
