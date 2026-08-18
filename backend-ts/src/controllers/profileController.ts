import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { hasActiveConsent, PrivacyDomainError, reauthenticate } from '../services/privacyService';
import { recordPrivacyAudit } from '../utils/auditLog';
import { v2 as cloudinary } from 'cloudinary';

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
  const username = req.body?.username; const emailRaw = req.body?.email; const avatarUrl = req.body?.avatarUrl;
  // Load current user to compare values and avoid unnecessary reauthentication.
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, username: true, avatarUrl: true } });
  if (!current) return error(res, 404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.');
  if (username === undefined && emailRaw === undefined && avatarUrl === undefined) return error(res, 400, 'NO_CHANGES', 'Informe ao menos um campo permitido.');
  const data: { username?: string; email?: string; avatarUrl?: string | null } = {};
  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 40) return error(res, 400, 'INVALID_USERNAME', 'Nome de usuário inválido.');
    if (username.trim() !== current.username) data.username = username.trim();
  }
  if (emailRaw !== undefined) {
    if (typeof emailRaw !== 'string' || !EMAIL_PATTERN.test(emailRaw.trim()) || emailRaw.length > 254) return error(res, 400, 'INVALID_EMAIL', 'E-mail inválido.');
    const email = emailRaw.trim().toLowerCase();
    if (email !== current.email) {
      try { await reauthenticate(userId, req.body?.password); }
      catch (reason) { if (reason instanceof PrivacyDomainError) return error(res, reason.status, reason.code, reason.message); throw reason; }
      data.email = email;
    }
    // if same as current email: ignore silently (do not require password)
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && (typeof avatarUrl !== 'string' || avatarUrl.length > 2048 || !/^https:\/\//i.test(avatarUrl))) return error(res, 400, 'INVALID_AVATAR_URL', 'Avatar deve usar uma URL HTTPS válida.');
    if (avatarUrl && !(await hasActiveConsent(userId, 'PUBLIC_AVATAR_HOSTING'))) return error(res, 409, 'AVATAR_CONSENT_REQUIRED', 'Autorize a hospedagem pública do avatar na área de privacidade.');
    // only update if different from stored
    if ((avatarUrl === null && current.avatarUrl !== null) || (avatarUrl !== null && avatarUrl.trim() !== (current.avatarUrl ?? '').trim())) data.avatarUrl = avatarUrl === null ? null : avatarUrl.trim();
  }
  if (Object.keys(data).length === 0) {
    return res.json({ user_id: userId, username: current.username, email: current.email, avatarUrl: current.avatarUrl });
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

export async function uploadAvatar(req: AuthRequest, res: Response) {
  const userId = authorize(req, res); if (!userId) return;
  const file = (req as any).file;
  if (!file) return error(res, 400, 'NO_FILE', 'Nenhum arquivo enviado.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return error(res, 400, 'INVALID_FILE_TYPE', 'Tipo de arquivo inválido. Apenas JPEG, PNG ou WebP são permitidos.');
  const MAX = 5 * 1024 * 1024;
  if (file.size > MAX) return error(res, 400, 'FILE_TOO_LARGE', 'Arquivo maior que o limite de 5 MB.');

  // Consent check
  if (!(await hasActiveConsent(userId, 'PUBLIC_AVATAR_HOSTING'))) return error(res, 409, 'AVATAR_CONSENT_REQUIRED', 'Autorize a hospedagem pública do avatar na área de privacidade.');

  const name = process.env.CLOUDINARY_CLOUD_NAME; const key = process.env.CLOUDINARY_API_KEY; const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) return error(res, 503, 'AVATAR_STORAGE_UNAVAILABLE', 'Serviço de hospedagem de avatar não configurado.');

  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });

  try {
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'teddycash/avatars' }, (err, value) => { if (err) return reject(err); resolve(value); });
      stream.end(file.buffer);
    });

    if (!result || !result.secure_url) return error(res, 502, 'AVATAR_UPLOAD_FAILED', 'Falha ao enviar imagem ao provedor.');

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: userId }, data: { avatarUrl: result.secure_url }, select: { id: true, username: true, email: true, avatarUrl: true } });
      await recordPrivacyAudit('AVATAR_UPDATED', userId, 'User', userId, tx);
      return user;
    });

    return res.json({ user_id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error('Avatar upload failed:', err instanceof Error ? err.message : err);
    return error(res, 502, 'AVATAR_UPLOAD_FAILED', 'Não foi possível enviar o avatar.');
  }
}
