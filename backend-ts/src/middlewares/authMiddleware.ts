import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request { userId?: string; }

function unauthorized(res: Response) {
  return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Sessão inválida ou expirada.' } });
}

export function decodeSessionToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { userId?: string; ver?: number };
  if (!decoded.userId || (decoded.ver !== undefined && !Number.isSafeInteger(decoded.ver))) throw new Error('Invalid session claims.');
  return { userId: decoded.userId, sessionVersion: decoded.ver ?? 0 };
}

export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return unauthorized(res);
  try {
    const identity = decodeSessionToken(token);
    const user = await prisma.user.findUnique({ where: { id: identity.userId }, select: { sessionVersion: true, privacyStatus: true } });
    if (!user || user.privacyStatus === 'ANONYMIZED' || user.sessionVersion !== identity.sessionVersion) return unauthorized(res);
    req.userId = identity.userId;
    return next();
  } catch { return unauthorized(res); }
}
