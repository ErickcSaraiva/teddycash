import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { prisma } from './config/prisma';
import { confirmPaidOrder } from './services/paymentOrderService';
import { claimDailyCheckin, redeemCredit } from './services/rewardService';
import { finishGameSession, startGameSession } from './services/gameService';
import { GameSessionUnavailableError } from './services/gameService';
import { InsufficientTeddyCoinsError } from './services/teddyCoinService';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';

test('economia transacional completa', { skip: !runDatabaseTests }, async () => {
  const suffix = crypto.randomUUID();
  const users = await Promise.all([
    prisma.user.create({ data: { username: `economy-${suffix}`, email: `economy-${suffix}@test.local`, password: 'test' } }),
    prisma.user.create({ data: { username: `poor-${suffix}`, email: `poor-${suffix}@test.local`, password: 'test', teddyCoins: 3 } }),
    prisma.user.create({ data: { username: `redeem-${suffix}`, email: `redeem-${suffix}@test.local`, password: 'test', teddyCoins: 500 } }),
  ]);
  const ids = users.map((user) => user.id);
  try {
    const order = await prisma.paymentOrder.create({ data: { userId: ids[0], packageCode: 'ADVANTAGE', amountCents: 1500, credits: 5, teddyCoins: 80, expiresAt: new Date(Date.now() + 60_000) } });
    let buyer = await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } });
    assert.equal(buyer.balance, 0, 'PENDING não altera créditos');
    assert.equal(buyer.teddyCoins, 0, 'PENDING não altera TeddyCoins');

    await confirmPaidOrder(order.id, `provider-${suffix}`);
    await confirmPaidOrder(order.id, `provider-${suffix}`);
    buyer = await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } });
    assert.equal(buyer.balance, 5);
    assert.equal(buyer.teddyCoins, 80, 'confirmação idempotente');

    const checkin = await claimDailyCheckin(ids[0]);
    assert.equal(checkin.movement.balanceAfter, 90);
    await assert.rejects(() => claimDailyCheckin(ids[0]));

    const started = await startGameSession(ids[0], 'coin-collector');
    assert.equal(started.teddyCoins, 85);
    const won = await finishGameSession(ids[0], started.session.id, true);
    assert.equal(won.teddyCoins, 110);
    await assert.rejects(() => finishGameSession(ids[0], started.session.id, true), GameSessionUnavailableError);
    await assert.rejects(() => startGameSession(ids[1], 'coin-collector'), InsufficientTeddyCoinsError);

    const redeemed = await redeemCredit(ids[2]);
    assert.equal(redeemed.credits, 1);
    assert.equal(redeemed.teddyCoins, 0);
    await assert.rejects(() => redeemCredit(ids[2]), InsufficientTeddyCoinsError);

    const movements = await prisma.teddyCoinTransaction.findMany({ where: { userId: ids[0] }, orderBy: { createdAt: 'asc' } });
    assert.deepEqual(movements.map((item) => item.balanceAfter), [80, 90, 85, 110]);
    assert.ok((await prisma.user.findMany({ where: { id: { in: ids } } })).every((user) => user.teddyCoins >= 0));
  } finally {
    await prisma.teddyCoinTransaction.deleteMany({ where: { userId: { in: ids } } });
    await prisma.transaction.deleteMany({ where: { userId: { in: ids } } });
    await prisma.gameSession.deleteMany({ where: { userId: { in: ids } } });
    await prisma.paymentOrder.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
});
