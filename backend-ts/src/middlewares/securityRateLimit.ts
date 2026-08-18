import { createHash } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from './authMiddleware';

type Bucket = { count: number; resetsAt: number };
const buckets = new Map<string, Bucket>();

export function createSecurityRateLimiter(limit: number, windowMs: number, scope: string, authenticated = false) {
  return (req: Request | AuthRequest, res: Response, next: NextFunction) => {
    const authUser = (req as AuthRequest).userId;
    if (authenticated && !authUser) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
    const identity = authUser ?? createHash('sha256').update(req.ip || 'unknown').digest('hex').slice(0, 16);
    const key = `${scope}:${identity}`; const now = Date.now(); const stored = buckets.get(key);
    const bucket = !stored || stored.resetsAt <= now ? { count: 0, resetsAt: now + windowMs } : stored;
    bucket.count += 1; buckets.set(key, bucket);
    res.setHeader('RateLimit-Limit', String(limit));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetsAt / 1000)));
    if (bucket.count > limit) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Muitas solicitações. Tente novamente mais tarde.' } });
    return next();
  };
}

export const loginRateLimit = createSecurityRateLimiter(10, 15 * 60_000, 'login');
export const registerRateLimit = createSecurityRateLimiter(5, 60 * 60_000, 'register');
export const privacyReadRateLimit = createSecurityRateLimiter(60, 60_000, 'privacy-read', true);
export const privacySensitiveRateLimit = createSecurityRateLimiter(5, 15 * 60_000, 'privacy-sensitive', true);
export const rewardRedemptionRateLimit = createSecurityRateLimiter(10, 60_000, 'reward-redemption', true);
