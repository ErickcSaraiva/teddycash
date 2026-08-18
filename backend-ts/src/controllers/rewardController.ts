import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { PROMOTIONAL_RULES } from '../config/promotionalRules';
import { claimDailyCheckin, getDailyCheckinStatus } from '../services/rewardService';
import { InsufficientTeddyCoinsError } from '../services/teddyCoinService';
import { getRewardCatalog, redeemCreditReward, RewardRedemptionError } from '../services/rewardRedemptionService';

type CheckinResult = {
  claimed: boolean; reward: number; teddyCoins: number; checkedInAt: Date | null;
  nextCheckinAt: Date; serverTime: Date;
};

function responseBody(result: CheckinResult, idempotent?: boolean) {
  return {
    success: true,
    claimed: result.claimed,
    idempotent: idempotent ?? result.claimed,
    reward: result.reward,
    teddy_coins: result.teddyCoins,
    checked_in_at: result.checkedInAt,
    next_checkin_at: result.nextCheckinAt,
    server_time: result.serverTime,
    time_zone: 'America/Manaus',
  };
}

export async function dailyCheckinStatus(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    return res.json(responseBody(await getDailyCheckinStatus(req.userId)));
  } catch (error) {
    console.error('Daily check-in status failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno ao consultar o check-in.' } });
  }
}

export async function dailyCheckin(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  try {
    const result = await claimDailyCheckin(req.userId);
    return res.json(responseBody({
      claimed: result.claimed, reward: result.movement.amount, teddyCoins: result.movement.balanceAfter,
      checkedInAt: result.checkedInAt, nextCheckinAt: result.nextCheckinAt, serverTime: result.serverTime,
    }, result.idempotent));
  } catch (error) {
    console.error('Daily check-in failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno no check-in.' } });
  }
}

export async function rewardCatalog(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  return res.json({ rewards: getRewardCatalog() });
}

export async function redeemCredit(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  const idempotencyKey = String(req.header('Idempotency-Key') ?? '').trim();
  try {
    const result = await redeemCreditReward(req.userId, idempotencyKey);
    return res.json({
      success: true,
      idempotent: result.idempotent,
      teddy_coins_spent: PROMOTIONAL_RULES.rewardCatalog.creditRedemption.teddyCoinCost,
      credits_received: PROMOTIONAL_RULES.rewardCatalog.creditRedemption.creditReward,
      credits: result.wallet.creditBalance,
      teddy_coins: result.wallet.teddyCoins,
      transaction_id: result.creditMovement.id,
    });
  } catch (error) {
    if (error instanceof InsufficientTeddyCoinsError) {
      return res.status(409).json({ error: { code: 'INSUFFICIENT_TEDDY_COINS', message: 'Você ainda não possui TeddyCoins suficientes para este resgate.' }, required: error.required, available: error.available });
    }
    if (error instanceof RewardRedemptionError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    }
    console.error('Reward redemption failed:', error instanceof Error ? error.name : 'UnknownError');
    return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno ao processar o resgate.' } });
  }
}
