import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { CheckinAlreadyClaimedError, claimDailyCheckin, redeemCredit } from '../services/rewardService';
import { InsufficientTeddyCoinsError } from '../services/teddyCoinService';

export async function dailyCheckin(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });
  try {
    const result = await claimDailyCheckin(req.userId);
    return res.json({ success: true, reward: 10, teddy_coins: result.movement.balanceAfter, checked_in_at: result.checkedInAt, next_checkin_at: result.nextCheckinAt });
  } catch (error) {
    if (error instanceof CheckinAlreadyClaimedError) {
      return res.status(409).json({ success: false, code: 'CHECKIN_ALREADY_CLAIMED', message: 'O check-in de hoje já foi realizado.', next_checkin_at: error.nextCheckinAt });
    }
    console.error('Daily check-in failed:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no check-in.' });
  }
}

export async function redeemCreditReward(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });
  try {
    const result = await redeemCredit(req.userId);
    return res.json({ success: true, spent_teddy_coins: 500, credits_added: 1, balance: { credits: result.credits, teddy_coins: result.teddyCoins } });
  } catch (error) {
    if (error instanceof InsufficientTeddyCoinsError) {
      return res.status(409).json({ success: false, code: 'INSUFFICIENT_TEDDY_COINS', required: error.required, available: error.available });
    }
    console.error('Credit redemption failed:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no resgate.' });
  }
}
