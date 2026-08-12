import type { NextFunction, Response } from 'express';
import type { AuthRequest } from './authMiddleware';
import { auditGameEvent } from '../utils/auditLog';

type Bucket = { count: number; resetsAt: number };
const buckets = new Map<string, Bucket>();

function createRateLimiter(limit: number, windowMs: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
    const route = `${req.method}:${req.baseUrl}${req.route?.path ?? req.path}`;
    const key = `${req.userId}:${route}`;
    const now = Date.now();
    const current = buckets.get(key);
    const bucket = !current || current.resetsAt <= now ? { count: 0, resetsAt: now + windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader('RateLimit-Limit', String(limit));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetsAt / 1000)));
    if (bucket.count > limit) {
      auditGameEvent('GAME_RATE_LIMITED', { userId: req.userId });
      return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Muitas solicitações. Tente novamente em instantes.' } });
    }
    return next();
  };
}

export const gameReadRateLimit = createRateLimiter(60, 60_000);
export const gameStartRateLimit = createRateLimiter(10, 60_000);
export const gameCompleteRateLimit = createRateLimiter(20, 60_000);
