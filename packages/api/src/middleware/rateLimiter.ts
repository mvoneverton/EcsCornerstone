import { Request, Response, NextFunction } from 'express';
import redis from '../db/redis';

interface RateLimitOptions {
  /** Sliding window duration in seconds */
  windowSeconds: number;
  /** Maximum requests allowed per window */
  max: number;
  /** Key prefix — disambiguates different limiters */
  prefix: string;
}

/**
 * Simple Redis increment-based rate limiter.
 * Key: `{prefix}:{ip}` — incremented per request, TTL set on first request.
 */
export function createRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip  = req.ip ?? 'unknown';
    const key = `rl:${options.prefix}:${ip}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        // First request in this window — set TTL
        await redis.expire(key, options.windowSeconds);
      }

      // Set standard rate-limit headers
      res.setHeader('X-RateLimit-Limit',     options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - count));

      if (count > options.max) {
        res.status(429).json({
          error: {
            message: 'Too many requests — please try again later.',
            code: 'RATE_LIMITED',
          },
        });
        return;
      }
    } catch {
      // Redis failure — fail open (don't block the request)
      console.error('[rate-limiter] Redis error — failing open');
    }

    next();
  };
}

/** Login and registration: 20 attempts per 15 minutes per IP */
export const authRateLimiter = createRateLimiter({
  prefix:        'auth',
  windowSeconds: 15 * 60,
  max:           20,
});

/** Password reset: 5 attempts per hour per IP */
export const passwordRateLimiter = createRateLimiter({
  prefix:        'pwd',
  windowSeconds: 60 * 60,
  max:           5,
});

/** General API: 120 requests per minute per IP */
export const generalRateLimiter = createRateLimiter({
  prefix:        'api',
  windowSeconds: 60,
  max:           120,
});
