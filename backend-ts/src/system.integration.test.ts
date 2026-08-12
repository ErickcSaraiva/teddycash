import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import app from './app';
import { prisma } from './config/prisma';
import { confirmPaidOrder } from './services/paymentOrderService';
import { containsSensitiveKeys, pseudonymize } from './utils/privacySecurity';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';

test('fluxo completo integrado preserva autenticação, economias, privacidade, Pix e máquinas', { skip: !runDatabaseTests, timeout: 30_000 }, async () => {
  const suffix = randomUUID(); const email = `phase8-${suffix}@test.local`; const username = `phase8-${suffix}`.slice(0, 40);
  const password = 'Phase8-test-password'; const machineId = `machine-${suffix}`; const machineKey = `key-${suffix}`;
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; let userId = '';
  async function api(method: string, path: string, body?: unknown, token?: string, headers?: Record<string, string>) {
    const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    const json = await response.json(); return { status: response.status, body: json as any };
  }
  try {
    await prisma.machine.create({ data: { id: machineId, name: 'Máquina de teste Fase 8', qrEnabled: true, nfcEnabled: true, apiKeyHash: createHash('sha256').update(machineKey).digest('hex') } });
    assert.equal((await api('POST', '/auth/register', { username, email, password })).status, 202);
    const login = await api('POST', '/auth/login', { email, password }); assert.equal(login.status, 200);
    const token = login.body.access_token as string; userId = login.body.user_id as string;
    assert.ok(token && userId); assert.equal(containsSensitiveKeys(login.body), true, 'token só aparece na resposta de autenticação');

    const restored = await api('GET', '/profile', undefined, token); assert.equal(restored.status, 200); assert.equal(restored.body.email, email);
    const initialWallet = await api('GET', '/wallet', undefined, token); assert.deepEqual(initialWallet.body, { credits: 0, teddy_coins: 0 });

    const checkin = await api('POST', '/rewards/daily-checkin', {}, token); assert.equal(checkin.status, 200); assert.equal(checkin.body.reward, 10);
    assert.deepEqual((await api('GET', '/wallet', undefined, token)).body, { credits: 0, teddy_coins: 10 });

    const start = await api('POST', '/games/coin-collector/start', {}, token); assert.equal(start.status, 201);
    await prisma.gameSession.update({ where: { id: start.body.session.id }, data: { startedAt: new Date(Date.now() - 30_000) } });
    const completionPayload = { session_id: start.body.session.id, session_token: start.body.session.token, duration_ms: 30_000, score: 1, events: [{ sequence: 1, type: 'COIN_TAP', occurred_at_ms: 100 }] };
    const completed = await api('POST', '/games/coin-collector/complete', completionPayload, token); assert.equal(completed.status, 200); assert.equal(completed.body.reward, 1); assert.equal(completed.body.idempotent, false);
    assert.deepEqual((await api('GET', '/wallet', undefined, token)).body, { credits: 0, teddy_coins: 11 });
    const duplicate = await api('POST', '/games/coin-collector/complete', completionPayload, token); assert.equal(duplicate.status, 200); assert.equal(duplicate.body.idempotent, true); assert.equal(duplicate.body.teddy_coins, 11);
    for (let index = 0; index < 4; index += 1) assert.equal((await api('POST', '/games/coin-collector/start', {}, token)).status, 201);
    assert.equal((await api('POST', '/games/coin-collector/start', {}, token)).status, 429);
    assert.equal((await api('GET', '/games/history', undefined, token)).body.pagination.total, 5);
    assert.equal((await api('GET', '/teddy-coins/transactions', undefined, token)).body.total, 2);

    const privacy = await api('GET', '/privacy', undefined, token); assert.equal(privacy.status, 200); assert.equal(privacy.body.account.email, email);
    const exported = await api('POST', '/privacy/requests/export', { password }, token); assert.equal(exported.status, 201);
    const serializedExport = JSON.stringify(exported.body.export);
    for (const forbidden of ['"password"', '"token"', '"tokenHash"', '"providerId"', '"apiKeyHash"']) {
      assert.equal(serializedExport.includes(forbidden), false, forbidden);
    }
    const deletion = await api('POST', '/privacy/requests/deletion', { password }, token); assert.equal(deletion.status, 201); assert.equal(deletion.body.request.status, 'AWAITING_CONFIRMATION');
    const requestId = deletion.body.request.id;
    assert.equal((await api('POST', `/privacy/requests/${requestId}/confirm`, { password }, token)).body.request.status, 'PENDING_REVIEW');
    assert.equal((await api('POST', `/privacy/requests/${requestId}/cancel`, { password }, token)).body.request.status, 'CANCELLED');

    const orderResponse = await api('POST', '/payment-orders/pix', { package_code: 'POPULAR' }, token); assert.equal(orderResponse.status, 201); assert.equal(orderResponse.body.payment.available, false);
    assert.deepEqual((await api('GET', '/wallet', undefined, token)).body, { credits: 0, teddy_coins: 11 }, 'Pix pendente não altera saldos');
    await confirmPaidOrder(orderResponse.body.order.id, `provider-${suffix}`); await confirmPaidOrder(orderResponse.body.order.id, `provider-${suffix}`);
    assert.deepEqual((await api('GET', '/wallet', undefined, token)).body, { credits: 3, teddy_coins: 41 }, 'pagamento idempotente credita uma vez');

    for (const channel of ['QR', 'NFC']) {
      const authorization = await api('POST', '/machine-authorizations', { machine_id: machineId, amount: 1, channel }, token); assert.equal(authorization.status, 201);
      const redeemed = await api('POST', '/machine-authorizations/redeem', { authorization_token: authorization.body.authorization_token }, undefined, { authorization: `Bearer ${machineKey}`, 'x-machine-id': machineId });
      assert.equal(redeemed.status, 200); assert.equal(redeemed.body.channel, channel);
    }
    assert.deepEqual((await api('GET', '/wallet', undefined, token)).body, { credits: 1, teddy_coins: 41 }, 'máquina debita somente créditos');
    assert.equal((await api('GET', `/transactions/${userId}`, undefined, token)).body.pagination.total, 3);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (userId) {
      await prisma.privacyConsent.deleteMany({ where: { userId } }); await prisma.privacyRequest.deleteMany({ where: { userId } });
      await prisma.privacyAuditLog.deleteMany({ where: { actorHash: pseudonymize(userId) } });
      await prisma.teddyCoinTransaction.deleteMany({ where: { userId } }); await prisma.transaction.deleteMany({ where: { userId } });
      await prisma.gameSession.deleteMany({ where: { userId } }); await prisma.machineAuthorization.deleteMany({ where: { userId } });
      await prisma.paymentOrder.deleteMany({ where: { userId } }); await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.machine.deleteMany({ where: { id: machineId } });
  }
});
