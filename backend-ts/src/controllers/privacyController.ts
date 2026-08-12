import type { Response } from 'express';
import { CONSENT_PURPOSES, PRIVACY_NOTICE, type ConsentPurpose } from '../config/privacyNotice';
import type { AuthRequest } from '../middlewares/authMiddleware';
import {
  cancelDeletionRequest, confirmDeletionRequest, createDataExport, createDeletionRequest,
  getPrivacyOverview, PrivacyDomainError, setConsent,
} from '../services/privacyService';

function fail(res: Response, error: unknown) {
  if (error instanceof PrivacyDomainError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  console.error('Privacy operation failed:', error instanceof Error ? error.name : 'UnknownError');
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível concluir a operação de privacidade.' } });
}

function idParam(req: AuthRequest) {
  const value = req.params.requestId; return Array.isArray(value) ? value[0] : value;
}

export async function privacyOverview(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    const data = await getPrivacyOverview(req.userId);
    const activePurposes = new Set(data.consents.filter((item) => !item.revokedAt).map((item) => item.purpose));
    return res.json({
      notice: PRIVACY_NOTICE,
      account: { user_id: data.user.id, username: data.user.username, email: data.user.email, avatar_url: data.user.avatarUrl, created_at: data.user.createdAt, updated_at: data.user.updatedAt, privacy_status: data.user.privacyStatus },
      consent_purposes: Object.entries(CONSENT_PURPOSES).map(([purpose, config]) => ({ purpose, ...config, granted: activePurposes.has(purpose) })),
      consent_history: data.consents.map((item) => ({ id: item.id, purpose: item.purpose, version: item.version, notice_version: item.noticeVersion, granted_at: item.grantedAt, revoked_at: item.revokedAt })),
      requests: data.requests.map((item) => ({ id: item.id, type: item.type, status: item.status, requested_at: item.requestedAt, confirmed_at: item.confirmedAt, processed_at: item.processedAt, cancelled_at: item.cancelledAt, notice_version: item.noticeVersion, decision_reason_code: item.decisionReasonCode })),
    });
  } catch (error) { return fail(res, error); }
}

export async function requestExport(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    const result = await createDataExport(req.userId, req.body?.password);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ request: { id: result.request.id, type: result.request.type, status: result.request.status, requested_at: result.request.requestedAt }, export: result.export });
  } catch (error) { return fail(res, error); }
}

export async function requestDeletion(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    const request = await createDeletionRequest(req.userId, req.body?.password);
    return res.status(201).json({ request: { id: request.id, type: request.type, status: request.status, requested_at: request.requestedAt } });
  } catch (error) { return fail(res, error); }
}

export async function confirmDeletion(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    const request = await confirmDeletionRequest(req.userId, idParam(req), req.body?.password);
    return res.json({ request: { id: request.id, type: request.type, status: request.status, confirmed_at: request.confirmedAt } });
  } catch (error) { return fail(res, error); }
}

export async function cancelDeletion(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    const request = await cancelDeletionRequest(req.userId, idParam(req), req.body?.password);
    return res.json({ request: { id: request.id, type: request.type, status: request.status, cancelled_at: request.cancelledAt } });
  } catch (error) { return fail(res, error); }
}

export async function updateConsent(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose : '';
  const granted = req.body?.granted;
  if (!(purpose in CONSENT_PURPOSES) || typeof granted !== 'boolean') return res.status(400).json({ error: { code: 'INVALID_CONSENT', message: 'Informe uma finalidade válida e a decisão explícita.' } });
  try {
    const consent = await setConsent(req.userId, purpose as ConsentPurpose, granted, req.body?.password);
    return res.json({ purpose, granted: Boolean(consent && !consent.revokedAt), changed_at: consent?.revokedAt ?? consent?.grantedAt ?? null });
  } catch (error) { return fail(res, error); }
}
