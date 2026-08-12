import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { CheckinAlreadyClaimedError, claimDailyCheckin } from '../services/rewardService';

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
