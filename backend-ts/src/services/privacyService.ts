import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { PrivacyRequestStatus, PrivacyRequestType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CONSENT_PURPOSES, PRIVACY_NOTICE, type ConsentPurpose } from '../config/privacyNotice';
import { recordPrivacyAudit } from '../utils/auditLog';
import { ownsResource, pseudonymize } from '../utils/privacySecurity';

export class PrivacyDomainError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

export async function reauthenticate(userId: string, password: unknown) {
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    throw new PrivacyDomainError('REAUTHENTICATION_REQUIRED', 401, 'Confirme sua senha para continuar.');
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true, privacyStatus: true } });
  if (!user || user.privacyStatus === 'ANONYMIZED' || !(await bcrypt.compare(password, user.password))) {
    throw new PrivacyDomainError('REAUTHENTICATION_FAILED', 401, 'Não foi possível confirmar sua identidade.');
  }
}

export async function getPrivacyOverview(userId: string) {
  const [user, requests, consents] = await prisma.$transaction([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: {
      id: true, username: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true, privacyStatus: true,
    } }),
    prisma.privacyRequest.findMany({ where: { userId }, orderBy: { requestedAt: 'desc' }, take: 50 }),
    prisma.privacyConsent.findMany({ where: { userId }, orderBy: { grantedAt: 'desc' } }),
  ]);
  return { user, requests, consents };
}

export async function createDataExport(userId: string, password: unknown) {
  await reauthenticate(userId, password);
  return prisma.$transaction(async (tx) => {
    const request = await tx.privacyRequest.create({ data: {
      userId, type: 'EXPORT', status: 'COMPLETED', noticeVersion: PRIVACY_NOTICE.currentVersion,
      confirmedAt: new Date(), processedAt: new Date(),
    } });
    const [account, creditTransactions, teddyCoinTransactions, gameSessions, paymentOrders, machineAuthorizations, consents, requests] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, username: true, email: true, avatarUrl: true, creditBalance: true, teddyCoins: true, createdAt: true, updatedAt: true, privacyStatus: true } }),
      tx.transaction.findMany({ where: { userId }, select: { id: true, amount: true, type: true, source: true, balanceAfter: true, machineId: true, channel: true, createdAt: true } }),
      tx.teddyCoinTransaction.findMany({ where: { userId }, select: { id: true, type: true, source: true, amount: true, balanceAfter: true, description: true, createdAt: true } }),
      tx.gameSession.findMany({ where: { userId }, select: { id: true, gameId: true, status: true, score: true, eventCount: true, rejectedReason: true, coinsEarned: true, startedAt: true, finishedAt: true } }),
      tx.paymentOrder.findMany({ where: { userId }, select: { id: true, packageCode: true, amountCents: true, credits: true, teddyCoins: true, provider: true, status: true, paidAt: true, expiresAt: true, createdAt: true } }),
      tx.machineAuthorization.findMany({ where: { userId }, select: { id: true, machineId: true, amount: true, channel: true, status: true, expiresAt: true, usedAt: true, createdAt: true } }),
      tx.privacyConsent.findMany({ where: { userId }, select: { id: true, purpose: true, version: true, noticeVersion: true, grantedAt: true, revokedAt: true } }),
      tx.privacyRequest.findMany({ where: { userId }, select: { id: true, type: true, status: true, noticeVersion: true, requestedAt: true, confirmedAt: true, processedAt: true, cancelledAt: true } }),
    ]);
    await recordPrivacyAudit('DATA_EXPORT_CREATED', userId, 'PrivacyRequest', request.id, tx);
    return { request, export: { generatedAt: new Date(), noticeVersion: PRIVACY_NOTICE.currentVersion, account, creditTransactions, teddyCoinTransactions, gameSessions, paymentOrders, machineAuthorizations, consents, requests } };
  });
}

export async function createDeletionRequest(userId: string, password: unknown) {
  await reauthenticate(userId, password);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`privacy-deletion:${userId}`}))`;
    const existing = await tx.privacyRequest.findFirst({ where: { userId, type: 'DELETION', status: { in: ['AWAITING_CONFIRMATION', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING'] } }, orderBy: { requestedAt: 'desc' } });
    if (existing) return existing;
    const request = await tx.privacyRequest.create({ data: { userId, type: 'DELETION', status: 'AWAITING_CONFIRMATION', noticeVersion: PRIVACY_NOTICE.currentVersion } });
    await recordPrivacyAudit('DELETION_REQUESTED', userId, 'PrivacyRequest', request.id, tx);
    return request;
  });
}

async function ownedRequest(userId: string, requestId: string, type?: PrivacyRequestType) {
  const request = await prisma.privacyRequest.findUnique({ where: { id: requestId } });
  if (!request || !ownsResource(userId, request.userId) || (type && request.type !== type)) {
    throw new PrivacyDomainError('REQUEST_NOT_FOUND', 404, 'Solicitação não encontrada.');
  }
  return request;
}

export async function confirmDeletionRequest(userId: string, requestId: string, password: unknown) {
  await reauthenticate(userId, password); await ownedRequest(userId, requestId, 'DELETION');
  return prisma.$transaction(async (tx) => {
    const update = await tx.privacyRequest.updateMany({ where: { id: requestId, userId, status: 'AWAITING_CONFIRMATION' }, data: { status: 'PENDING_REVIEW', confirmedAt: new Date() } });
    if (!update.count) throw new PrivacyDomainError('INVALID_REQUEST_STATE', 409, 'A solicitação não pode ser confirmada neste estado.');
    await tx.user.update({ where: { id: userId }, data: { privacyStatus: 'DELETION_PENDING' } });
    await recordPrivacyAudit('DELETION_CONFIRMED', userId, 'PrivacyRequest', requestId, tx);
    return tx.privacyRequest.findUniqueOrThrow({ where: { id: requestId } });
  });
}

export async function cancelDeletionRequest(userId: string, requestId: string, password: unknown) {
  await reauthenticate(userId, password); await ownedRequest(userId, requestId, 'DELETION');
  return prisma.$transaction(async (tx) => {
    const update = await tx.privacyRequest.updateMany({ where: { id: requestId, userId, status: { in: ['AWAITING_CONFIRMATION', 'PENDING_REVIEW'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    if (!update.count) throw new PrivacyDomainError('INVALID_REQUEST_STATE', 409, 'A solicitação não pode ser cancelada neste estado.');
    await tx.user.update({ where: { id: userId }, data: { privacyStatus: 'ACTIVE' } });
    await recordPrivacyAudit('DELETION_CANCELLED', userId, 'PrivacyRequest', requestId, tx);
    return tx.privacyRequest.findUniqueOrThrow({ where: { id: requestId } });
  });
}

export async function setConsent(userId: string, purpose: ConsentPurpose, grant: boolean, password: unknown) {
  if (!CONSENT_PURPOSES[purpose]) throw new PrivacyDomainError('INVALID_CONSENT_PURPOSE', 400, 'Finalidade de consentimento inválida.');
  await reauthenticate(userId, password);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`privacy-consent:${userId}:${purpose}`}))`;
    const active = await tx.privacyConsent.findFirst({ where: { userId, purpose, revokedAt: null }, orderBy: { grantedAt: 'desc' } });
    if (grant && active) return active;
    if (!grant && !active) return null;
    if (grant) {
      const consent = await tx.privacyConsent.create({ data: { userId, purpose, version: CONSENT_PURPOSES[purpose].version, noticeVersion: PRIVACY_NOTICE.currentVersion } });
      await recordPrivacyAudit('CONSENT_GRANTED', userId, 'PrivacyConsent', consent.id, tx); return consent;
    }
    const consent = await tx.privacyConsent.update({ where: { id: active!.id }, data: { revokedAt: new Date() } });
    if (purpose === 'PUBLIC_AVATAR_HOSTING') await tx.user.update({ where: { id: userId }, data: { avatarUrl: null } });
    await recordPrivacyAudit('CONSENT_REVOKED', userId, 'PrivacyConsent', consent.id, tx); return consent;
  });
}

export async function hasActiveConsent(userId: string, purpose: ConsentPurpose) {
  return Boolean(await prisma.privacyConsent.findFirst({ where: { userId, purpose, revokedAt: null } }));
}

// Internal-only preparation. Do not expose as a public route without legal/operational approval.
export async function processApprovedDeletion(requestId: string) {
  const request = await prisma.privacyRequest.findUnique({ where: { id: requestId } });
  if (!request || request.type !== 'DELETION' || request.status !== 'APPROVED') throw new PrivacyDomainError('REQUEST_NOT_APPROVED', 409, 'Solicitação ainda não aprovada para processamento.');
  const suffix = pseudonymize(`${request.userId}:${randomBytes(16).toString('hex')}`);
  const password = await bcrypt.hash(randomBytes(32).toString('base64url'), 12);
  return prisma.$transaction(async (tx) => {
    await tx.privacyRequest.update({ where: { id: request.id }, data: { status: 'PROCESSING' } });
    await tx.privacyConsent.updateMany({ where: { userId: request.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.user.update({ where: { id: request.userId }, data: {
      username: `deleted_${suffix}`, email: `deleted_${suffix}@invalid.teddycash`, password, avatarUrl: null,
      privacyStatus: 'ANONYMIZED', sessionVersion: { increment: 1 },
    } });
    const completed = await tx.privacyRequest.update({ where: { id: request.id }, data: { status: 'COMPLETED', processedAt: new Date() } });
    await recordPrivacyAudit('ACCOUNT_ANONYMIZED', request.userId, 'PrivacyRequest', request.id, tx);
    return completed;
  });
}

export const privacyRequestStatuses: readonly PrivacyRequestStatus[] = ['AWAITING_CONFIRMATION', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
