import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { prisma } from './config/prisma';
import { cancelDeletionRequest, confirmDeletionRequest, createDataExport, createDeletionRequest, PrivacyDomainError, reauthenticate, setConsent } from './services/privacyService';
import { pseudonymize } from './utils/privacySecurity';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';

test('direitos de privacidade ficam isolados por usuário e exigem reautenticação', { skip: !runDatabaseTests }, async () => {
  const suffix = crypto.randomUUID(); const password = 'privacy-test-password'; const hash = await bcrypt.hash(password, 12);
  const [owner, other] = await Promise.all([
    prisma.user.create({ data: { username: `privacy-${suffix}`, email: `privacy-${suffix}@test.local`, password: hash, creditBalance: 7, teddyCoins: 11 } }),
    prisma.user.create({ data: { username: `privacy-other-${suffix}`, email: `privacy-other-${suffix}@test.local`, password: hash } }),
  ]);
  const ids = [owner.id, other.id];
  try {
    await assert.rejects(() => reauthenticate(owner.id, 'wrong-password'), (error: unknown) => error instanceof PrivacyDomainError && error.code === 'REAUTHENTICATION_FAILED');
    const granted = await setConsent(owner.id, 'PUBLIC_AVATAR_HOSTING', true, password);
    assert.ok(granted && !granted.revokedAt);
    await prisma.user.update({ where: { id: owner.id }, data: { avatarUrl: 'https://example.invalid/avatar.png' } });
    const revoked = await setConsent(owner.id, 'PUBLIC_AVATAR_HOSTING', false, password);
    assert.ok(revoked?.revokedAt);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).avatarUrl, null);

    const exported = await createDataExport(owner.id, password);
    const serialized = JSON.stringify(exported.export);
    for (const forbidden of ['"password"', '"token"', '"tokenHash"', '"providerId"', '"apiKeyHash"']) assert.equal(serialized.includes(forbidden), false, forbidden);
    assert.equal(exported.export.account.creditBalance, 7);

    const deletion = await createDeletionRequest(owner.id, password);
    const duplicate = await createDeletionRequest(owner.id, password);
    assert.equal(duplicate.id, deletion.id);
    await assert.rejects(() => confirmDeletionRequest(other.id, deletion.id, password), (error: unknown) => error instanceof PrivacyDomainError && error.code === 'REQUEST_NOT_FOUND');
    const confirmed = await confirmDeletionRequest(owner.id, deletion.id, password);
    assert.equal(confirmed.status, 'PENDING_REVIEW');
    const cancelled = await cancelDeletionRequest(owner.id, deletion.id, password);
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).privacyStatus, 'ACTIVE');
  } finally {
    await prisma.privacyConsent.deleteMany({ where: { userId: { in: ids } } });
    await prisma.privacyRequest.deleteMany({ where: { userId: { in: ids } } });
    await prisma.privacyAuditLog.deleteMany({ where: { actorHash: { in: ids.map(pseudonymize) } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
});
