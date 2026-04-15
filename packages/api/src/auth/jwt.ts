import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { JwtPayload } from '../types';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  ?? 'dev-access-secret-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-production';
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  ?? '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? '30d';

export interface RefreshTokenPayload {
  sub: string;  // userId
  jti: string;  // unique token ID stored in Redis
}

// ── Access token ──────────────────────────────────────────────────────────────

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
    issuer: 'ecscornerstone',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: 'ecscornerstone',
    }) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Refresh token ─────────────────────────────────────────────────────────────

export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = uuidv4();
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
    issuer: 'ecscornerstone',
  } as jwt.SignOptions);
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET, {
      issuer: 'ecscornerstone',
    }) as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

/** 30 days in seconds — matches JWT_REFRESH_EXPIRY */
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export const REFRESH_COOKIE_NAME = 'ecs_refresh';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: REFRESH_TTL_SECONDS * 1000,  // ms
  path: '/api/auth',
};
