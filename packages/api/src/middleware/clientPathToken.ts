import crypto from 'crypto';
import pool from '../db/client';

const SECRET = process.env.PATH_TOKEN_SECRET ?? '';

// ── Token generation & hashing ────────────────────────────────────────────────

export function generatePathToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHmac('sha256', SECRET).update(token).digest('hex');
}

// ── Token validation ──────────────────────────────────────────────────────────

export interface PathTokenPayload {
  clientId: string;
  paths:    string[];
}

export async function validatePathToken(token: string): Promise<PathTokenPayload | null> {
  if (!token) return null;

  const hash = hashToken(token);

  const { rows } = await pool.query<{
    user_id:    string;
    paths:      string[];
    expires_at: Date;
    used_at:    Date | null;
  }>(
    `SELECT user_id, paths, expires_at, used_at
     FROM path_tokens
     WHERE token_hash = $1`,
    [hash],
  );

  if (!rows.length) return null;

  const row = rows[0];

  if (row.expires_at < new Date()) return null;

  return { clientId: row.user_id, paths: row.paths };
}
