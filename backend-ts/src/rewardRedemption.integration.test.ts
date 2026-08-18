import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { prisma } from './config/prisma';
import { PROMOTIONAL_RULES } from './config/promotionalRules';
import { redeemCreditReward } from './services/rewardRedemptionService';
import { InsufficientTeddyCoinsError } from './services/teddyCoinService';

const runDatabaseTests = process.env.RUN_DB_TESTS === '1';

async function testUser(teddyCoins: number) {
  const suffix = randomUUID();
  return prisma.user.create({ data: { username: `redeem-${suffix}`, email: `redeem-${suffix}@test.local`, password: 'test', teddyCoins } });
}

async function cleanup(userId: string) {
  await prisma.teddyCoinTransaction.deleteMany({ where: { userId } });
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

test('resgate aplica exclusivamente 500 TeddyCoins por 1 crédito e mantém os dois históricos', { skip: !runDatabaseTests }, async () => {
  assert.deepEqual(PROMOTIONAL_RULES.rewardCatalog.creditRedemption, {
    id: 'credit-redemption', active: true, teddyCoinCost: 500, creditReward: 1,
  });
  const insufficient = await testUser(499);
  const exact = await testUser(500);
  const twice = await testUser(1000);
  try {
    await assert.rejects(() => redeemCreditReward(insufficient.id, 'insufficient-499'), InsufficientTeddyCoinsError);
    assert.deepEqual(await prisma.user.findUnique({ where: { id: insufficient.id }, select: { teddyCoins: true, creditBalance: true } }), { teddyCoins: 499, creditBalance: 0 });

    const exactResult = await redeemCreditReward(exact.id, 'exact-request-500');
    assert.equal(exactResult.idempotent, false);
    assert.deepEqual(exactResult.wallet, { teddyCoins: 0, creditBalance: 1 });

    await redeemCreditReward(twice.id, 'first-request-1000');
    assert.deepEqual(await prisma.user.findUnique({ where: { id: twice.id }, select: { teddyCoins: true, creditBalance: true } }), { teddyCoins: 500, creditBalance: 1 });
    await redeemCreditReward(twice.id, 'second-request-1000');
    assert.deepEqual(await prisma.user.findUnique({ where: { id: twice.id }, select: { teddyCoins: true, creditBalance: true } }), { teddyCoins: 0, creditBalance: 2 });

    const teddyHistory = await prisma.teddyCoinTransaction.findMany({ where: { userId: twice.id, type: 'CREDIT_REDEMPTION' }, orderBy: { createdAt: 'asc' } });
    const creditHistory = await prisma.transaction.findMany({ where: { userId: twice.id, type: 'TEDDYCOIN_CREDIT_REDEMPTION' }, orderBy: { createdAt: 'asc' } });
    assert.deepEqual(teddyHistory.map((item) => ({ amount: item.amount, source: item.source, balanceAfter: item.balanceAfter })), [
      { amount: -500, source: 'REWARD_REDEMPTION', balanceAfter: 500 },
      { amount: -500, source: 'REWARD_REDEMPTION', balanceAfter: 0 },
    ]);
    assert.deepEqual(creditHistory.map((item) => ({ amount: item.amount, source: item.source, balanceAfter: item.balanceAfter })), [
      { amount: 1, source: 'REWARD_REDEMPTION', balanceAfter: 1 },
      { amount: 1, source: 'REWARD_REDEMPTION', balanceAfter: 2 },
    ]);
  } finally {
    await cleanup(insufficient.id); await cleanup(exact.id); await cleanup(twice.id);
  }
});

test('repetição idempotente e duas requisições concorrentes nunca duplicam crédito', { skip: !runDatabaseTests }, async () => {
  const duplicate = await testUser(500);
  const concurrent = await testUser(500);
  try {
    const first = await redeemCreditReward(duplicate.id, 'duplicate-request');
    const repeated = await redeemCreditReward(duplicate.id, 'duplicate-request');
    assert.equal(first.idempotent, false); assert.equal(repeated.idempotent, true);
    assert.deepEqual(await prisma.user.findUnique({ where: { id: duplicate.id }, select: { teddyCoins: true, creditBalance: true } }), { teddyCoins: 0, creditBalance: 1 });

    const settled = await Promise.allSettled([
      redeemCreditReward(concurrent.id, 'concurrent-request-a'),
      redeemCreditReward(concurrent.id, 'concurrent-request-b'),
    ]);
    assert.equal(settled.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(settled.filter((item) => item.status === 'rejected' && item.reason instanceof InsufficientTeddyCoinsError).length, 1);
    assert.deepEqual(await prisma.user.findUnique({ where: { id: concurrent.id }, select: { teddyCoins: true, creditBalance: true } }), { teddyCoins: 0, creditBalance: 1 });
  } finally {
    await cleanup(duplicate.id); await cleanup(concurrent.id);
  }
});
