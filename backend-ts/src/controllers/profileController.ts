import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { hasActiveConsent, PrivacyDomainError, reauthenticate } from '../services/privacyService';
import { recordPrivacyAudit } from '../utils/auditLog';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function error(res: Response, status: number, code: string, message: string) { return res.status(status).json({ error: { code, message } }); }
function requestedUserId(req: AuthRequest) { const value = req.params.userId; return Array.isArray(value) ? value[0] : value; }
function authorize(req: AuthRequest, res: Response) {
  if (!req.userId) { error(res, 401, 'AUTH_REQUIRED', 'Autenticação obrigatória.'); return null; }
  const requested = requestedUserId(req);
  if (requested && requested !== req.userId) { error(res, 404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.'); return null; }
  return req.userId;
}

export async function getProfile(req: AuthRequest, res: Response) {
  const userId = authorize(req, res); if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, email: true, avatarUrl: true } });
  if (!user) return error(res, 404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.');
  return res.json({ user_id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const userId = authorize(req, res); if (!userId) return;
  const username = req.body?.username; const email = req.body?.email; const avatarUrl = req.body?.avatarUrl;
  if (username === undefined && email === undefined && avatarUrl === undefined) return error(res, 400, 'NO_CHANGES', 'Informe ao menos um campo permitido.');
  const data: { username?: string; email?: string; avatarUrl?: string | null } = {};
  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 40) return error(res, 400, 'INVALID_USERNAME', 'Nome de usuário inválido.');
    data.username = username.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) || email.length > 254) return error(res, 400, 'INVALID_EMAIL', 'E-mail inválido.');
    try { await reauthenticate(userId, req.body?.password); }
    catch (reason) { if (reason instanceof PrivacyDomainError) return error(res, reason.status, reason.code, reason.message); throw reason; }
    data.email = email.trim().toLowerCase();
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && (typeof avatarUrl !== 'string' || avatarUrl.length > 2048 || !/^https:\/\//i.test(avatarUrl))) return error(res, 400, 'INVALID_AVATAR_URL', 'Avatar deve usar uma URL HTTPS válida.');
    if (avatarUrl && !(await hasActiveConsent(userId, 'PUBLIC_AVATAR_HOSTING'))) return error(res, 409, 'AVATAR_CONSENT_REQUIRED', 'Autorize a hospedagem pública do avatar na área de privacidade.');
    data.avatarUrl = avatarUrl === null ? null : avatarUrl.trim();
  }
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: userId }, data, select: { id: true, username: true, email: true, avatarUrl: true } });
      await recordPrivacyAudit('PROFILE_CORRECTED', userId, 'User', userId, tx); return user;
    });
    return res.json({ user_id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl });
  } catch (reason) {
    if (reason instanceof Prisma.PrismaClientKnownRequestError && reason.code === 'P2002') return error(res, 409, 'PROFILE_VALUE_UNAVAILABLE', 'Não foi possível usar os dados informados.');
    console.error('Profile update failed:', reason instanceof Error ? reason.name : 'UnknownError');
    return error(res, 500, 'INTERNAL_SERVER_ERROR', 'Não foi possível atualizar o perfil.');
  }
}
