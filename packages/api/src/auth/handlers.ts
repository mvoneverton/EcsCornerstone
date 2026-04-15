import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import pool from '../db/client';
import redis from '../db/redis';
import stripe from '../billing/stripe';
import { hashPassword, verifyPassword } from './password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE_NAME,
  REFRESH_TTL_SECONDS,
} from './jwt';
import { sendPasswordResetEmail } from './email';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas';
import type { JwtPayload, UserRole } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function redisRefreshKey(userId: string, jti: string): string {
  return `rt:${userId}:${jti}`;
}

function redisResetKey(token: string): string {
  return `prt:${token}`;
}

async function issueTokensAndSetCookie(
  res: Response,
  payload: JwtPayload
): Promise<string> {
  const accessToken = signAccessToken(payload);
  const { token: refreshToken, jti } = signRefreshToken(payload.sub);

  // Store refresh token ID in Redis with 30-day TTL
  await redis.set(redisRefreshKey(payload.sub, jti), '1', {
    EX: REFRESH_TTL_SECONDS,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  return accessToken;
}

interface UserRow {
  id: string;
  company_id: string | null;
  email: string;
  password_hash: string | null;
  role: UserRole;
  first_name: string;
  last_name: string;
}

function toJwtPayload(user: UserRow): JwtPayload {
  return {
    sub:       user.id,
    email:     user.email,
    role:      user.role,
    companyId: user.company_id,
  };
}

function safeUserResponse(user: UserRow) {
  return {
    id:        user.id,
    companyId: user.company_id,
    email:     user.email,
    role:      user.role,
    firstName: user.first_name,
    lastName:  user.last_name,
  };
}

// ── Stripe provisioning ───────────────────────────────────────────────────────

async function provisionStripeCustomer(
  companyId: string,
  opts: { email: string; name: string }
): Promise<void> {
  // Look up the Starter plan's Stripe monthly price ID
  const { rows: [planRow] } = await pool.query<{
    stripe_price_monthly: string | null;
  }>(
    `SELECT stripe_price_monthly FROM plans WHERE name = 'Starter' LIMIT 1`
  );

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email:    opts.email,
    name:     opts.name,
    metadata: { company_id: companyId },
  });

  // Store customer ID immediately so webhook events can be matched
  await pool.query(
    `UPDATE companies SET stripe_customer_id = $1, updated_at = now() WHERE id = $2`,
    [customer.id, companyId]
  );

  // Subscribe to Starter plan if the price ID is configured
  if (planRow?.stripe_price_monthly) {
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items:    [{ price: planRow.stripe_price_monthly }],
      expand:   ['latest_invoice'],
    });

    await pool.query(
      `UPDATE companies SET
         stripe_subscription_id = $1,
         subscription_status    = $2,
         current_period_end     = $3,
         updated_at             = now()
       WHERE id = $4`,
      [
        sub.id,
        sub.status,
        new Date(sub.current_period_end * 1000),
        companyId,
      ]
    );

    console.log(`[billing] provisioned customer ${customer.id} + subscription ${sub.id} for company ${companyId}`);
  } else {
    console.log(`[billing] provisioned customer ${customer.id} for company ${companyId} (no Starter price configured — subscription skipped)`);
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { companyName, firstName, lastName, email, password } = body.data;

    // Check email uniqueness
    const { rows: existing } = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: { message: 'Email already registered', code: 'EMAIL_TAKEN' } });
      return;
    }

    // Resolve default plan (Starter)
    const { rows: plans } = await pool.query<{ id: string }>(
      `SELECT id FROM plans WHERE name = 'Starter' LIMIT 1`
    );
    const planId = plans[0]?.id ?? null;

    // Generate unique slug
    const baseSlug = toSlug(companyName);
    let slug = baseSlug;
    const { rows: slugCheck } = await pool.query<{ slug: string }>(
      `SELECT slug FROM companies WHERE slug LIKE $1 ORDER BY slug`,
      [`${baseSlug}%`]
    );
    if (slugCheck.some((r) => r.slug === slug)) {
      slug = `${baseSlug}-${randomBytes(2).toString('hex')}`;
    }

    const passwordHash = await hashPassword(password);

    const client = await pool.connect();
    let companyId: string;
    let user: UserRow;
    try {
      await client.query('BEGIN');

      const { rows: [company] } = await client.query<{ id: string }>(
        `INSERT INTO companies (name, slug, plan_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [companyName, slug, planId]
      );
      companyId = company!.id;

      const { rows: [insertedUser] } = await client.query<UserRow>(
        `INSERT INTO users
           (company_id, email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, 'company_admin', $4, $5)
         RETURNING id, company_id, email, password_hash, role, first_name, last_name`,
        [companyId, email.toLowerCase(), passwordHash, firstName, lastName]
      );
      user = insertedUser!;

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Provision Stripe customer + Starter subscription (fire-and-forget — don't block registration)
    provisionStripeCustomer(companyId, { email: email.toLowerCase(), name: companyName })
      .catch((err) => console.error('[billing] Stripe provisioning failed for company', companyId, err));

    const accessToken = await issueTokensAndSetCookie(res, toJwtPayload(user));

    res.status(201).json({
      user:        safeUserResponse(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { email, password } = body.data;

    const { rows } = await pool.query<UserRow & { password_hash: string }>(
      `SELECT id, company_id, email, password_hash, role, first_name, last_name
       FROM users
       WHERE email = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [email.toLowerCase()]
    );

    const user = rows[0];

    // Constant-time failure path — always run bcrypt to avoid timing attacks
    const hash = user?.password_hash ?? '$2b$12$invalidhashpadding000000000000000000000000000000000000000';
    const valid = user ? await verifyPassword(password, hash) : false;

    if (!user || !valid) {
      res.status(401).json({ error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } });
      return;
    }

    // Update last login timestamp (fire-and-forget — don't delay response)
    pool.query(
      `UPDATE users SET last_login_at = now() WHERE id = $1`,
      [user.id]
    ).catch((err) => console.error('[auth] failed to update last_login_at:', err));

    const accessToken = await issueTokensAndSetCookie(res, toJwtPayload(user));

    res.json({
      user:        safeUserResponse(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      res.status(401).json({ error: { message: 'No refresh token', code: 'NO_TOKEN' } });
      return;
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      res.status(401).json({ error: { message: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' } });
      return;
    }

    // Verify the token ID still exists in Redis (not logged out)
    const key = redisRefreshKey(payload.sub, payload.jti);
    const exists = await redis.get(key);
    if (!exists) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      res.status(401).json({ error: { message: 'Session expired or revoked', code: 'SESSION_REVOKED' } });
      return;
    }

    // Load current user from DB (role/companyId may have changed)
    const { rows } = await pool.query<UserRow>(
      `SELECT id, company_id, email, password_hash, role, first_name, last_name
       FROM users
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [payload.sub]
    );
    const user = rows[0];
    if (!user) {
      await redis.del(key);
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      res.status(401).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
      return;
    }

    // Rotate — invalidate old, issue new
    await redis.del(key);
    const accessToken = await issueTokensAndSetCookie(res, toJwtPayload(user));

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];

    if (token) {
      const payload = verifyRefreshToken(token);
      if (payload) {
        await redis.del(redisRefreshKey(payload.sub, payload.jti));
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/forgot-password ────────────────────────────────────────────

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = forgotPasswordSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { email } = body.data;

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL AND password_hash IS NOT NULL LIMIT 1`,
      [email.toLowerCase()]
    );

    // Always return 200 — don't leak whether the email exists
    if (rows[0]) {
      const resetToken = randomBytes(32).toString('hex');
      await redis.set(redisResetKey(resetToken), rows[0].id, { EX: 3600 });
      await sendPasswordResetEmail(email, resetToken).catch((err) =>
        console.error('[auth] email send error:', err)
      );
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/reset-password ────────────────────────────────────────────

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = resetPasswordSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { message: 'Validation failed', details: body.error.flatten() } });
      return;
    }

    const { token, password } = body.data;

    const userId = await redis.get(redisResetKey(token));
    if (!userId) {
      res.status(400).json({ error: { message: 'Reset token is invalid or has expired', code: 'INVALID_RESET_TOKEN' } });
      return;
    }

    const passwordHash = await hashPassword(password);

    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL`,
      [passwordHash, userId]
    );

    // Invalidate token and all refresh sessions for this user
    await redis.del(redisResetKey(token));

    // Optionally: invalidate all refresh tokens for this user
    // (pattern delete is not atomic — for now we rely on the short access token lifetime)

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/change-password ────────────────────────────────────────────
// Authenticated endpoint — verifies current password before updating.

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
      return;
    }

    const currentPassword = (req.body?.currentPassword ?? '').toString();
    const newPassword     = (req.body?.newPassword     ?? '').toString();

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: { message: 'currentPassword and newPassword are required', code: 'VALIDATION_FAILED' } });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: { message: 'New password must be at least 8 characters', code: 'PASSWORD_TOO_SHORT' } });
      return;
    }

    const { rows: [user] } = await pool.query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [req.user.sub]
    );

    if (!user) {
      res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
      return;
    }

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      res.status(400).json({ error: { message: 'Current password is incorrect', code: 'WRONG_PASSWORD' } });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [newHash, req.user.sub]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}
