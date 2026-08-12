import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { prisma } from './config/prisma';
import { confirmPaidOrder } from './services/paymentOrderService';
import { claimDailyCheckin } from './services/rewardService';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';

test('economia transacional completa', { skip: !runDatabaseTests }, async () => {
  const suffix = crypto.randomUUID();
  const users = await Promise.all([
    prisma.user.create({ data: { username: `economy-${suffix}`, email: `economy-${suffix}@test.local`, password: 'test' } }),
  ]);
  const ids = users.map((user) => user.id);
  try {
    const order = await prisma.paymentOrder.create({ data: { userId: ids[0], packageCode: 'ADVANTAGE', amountCents: 1500, credits: 5, teddyCoins: 80, expiresAt: new Date(Date.now() + 60_000) } });
    let buyer = await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } });
    assert.equal(buyer.creditBalance, 0, 'PENDING não altera créditos');
    assert.equal(buyer.teddyCoins, 0, 'PENDING não altera TeddyCoins');

    await confirmPaidOrder(order.id, `provider-${suffix}`);
    await confirmPaidOrder(order.id, `provider-${suffix}`);
    buyer = await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } });
    assert.equal(buyer.creditBalance, 5);
    assert.equal(buyer.teddyCoins, 80, 'confirmação idempotente');

    const checkin = await claimDailyCheckin(ids[0]);
    assert.equal(checkin.movement.balanceAfter, 90);
    await assert.rejects(() => claimDailyCheckin(ids[0]));

    const movements = await prisma.teddyCoinTransaction.findMany({ where: { userId: ids[0] }, orderBy: { createdAt: 'asc' } });
    assert.deepEqual(movements.map((item) => item.balanceAfter), [80, 90]);
    const creditMovements = await prisma.transaction.findMany({ where: { userId: ids[0] } });
    assert.deepEqual(creditMovements.map((item) => ({ amount: item.amount, source: item.source, referenceId: item.referenceId })), [
      { amount: 5, source: 'PAYMENT_ORDER', referenceId: order.id },
    ]);
    assert.ok((await prisma.user.findMany({ where: { id: { in: ids } } })).every((user) => user.teddyCoins >= 0));
  } finally {
    await prisma.teddyCoinTransaction.deleteMany({ where: { userId: { in: ids } } });
    await prisma.transaction.deleteMany({ where: { userId: { in: ids } } });
    await prisma.gameSession.deleteMany({ where: { userId: { in: ids } } });
    await prisma.paymentOrder.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
});
