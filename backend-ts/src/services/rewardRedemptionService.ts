import { prisma } from '../config/prisma';
import { PROMOTIONAL_RULES } from '../config/promotionalRules';
import { recordCreditMovement } from './creditService';
import { debitTeddyCoinsInTransaction } from './teddyCoinService';

const CREDIT_REDEMPTION = PROMOTIONAL_RULES.rewardCatalog.creditRedemption;

export class RewardRedemptionError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}

export function getRewardCatalog() {
  return [{
    id: CREDIT_REDEMPTION.id,
    active: CREDIT_REDEMPTION.active,
    teddy_coin_cost: CREDIT_REDEMPTION.teddyCoinCost,
    credit_reward: CREDIT_REDEMPTION.creditReward,
  }];
}

export async function redeemCreditReward(userId: string, idempotencyKey: string) {
  if (!CREDIT_REDEMPTION.active) throw new RewardRedemptionError('REWARD_UNAVAILABLE', 409, 'Esta recompensa não está disponível.');
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
    throw new RewardRedemptionError('INVALID_IDEMPOTENCY_KEY', 400, 'Identificador idempotente inválido.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`reward-redemption:${userId}`}))`;

    const previousCredit = await tx.transaction.findUnique({
      where: { userId_type_referenceId: { userId, type: 'TEDDYCOIN_CREDIT_REDEMPTION', referenceId: idempotencyKey } },
    });
    if (previousCredit) {
      const wallet = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { creditBalance: true, teddyCoins: true } });
      return { idempotent: true, creditMovement: previousCredit, wallet };
    }

    const teddyMovement = await debitTeddyCoinsInTransaction(tx, {
      userId,
      amount: CREDIT_REDEMPTION.teddyCoinCost,
      type: 'CREDIT_REDEMPTION',
      source: 'REWARD_REDEMPTION',
      referenceId: idempotencyKey,
      description: `${CREDIT_REDEMPTION.teddyCoinCost} TeddyCoins por ${CREDIT_REDEMPTION.creditReward} crédito de jogada`,
    });
    const creditMovement = await recordCreditMovement(tx, {
      userId,
      amount: CREDIT_REDEMPTION.creditReward,
      type: 'TEDDYCOIN_CREDIT_REDEMPTION',
      source: 'REWARD_REDEMPTION',
      referenceId: idempotencyKey,
    });
    const wallet = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { creditBalance: true, teddyCoins: true } });
    return { idempotent: false, teddyMovement, creditMovement, wallet };
  });
}
