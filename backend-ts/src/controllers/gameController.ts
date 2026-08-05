import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import { InvalidGameError, startGameSession } from '../services/gameService';
import { InsufficientTeddyCoinsError } from '../services/teddyCoinService';

export async function startGame(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });
  const gameId = Array.isArray(req.params.gameId) ? req.params.gameId[0] : req.params.gameId;
  try {
    const result = await startGameSession(req.userId, gameId);
    return res.status(201).json({ success: true, session: { id: result.session.id, game_id: result.session.gameId, started_at: result.session.startedAt, status: result.session.status }, entry_cost: 5, teddy_coins: result.teddyCoins });
  } catch (error) {
    if (error instanceof InvalidGameError) return res.status(404).json({ success: false, code: 'GAME_NOT_FOUND' });
    if (error instanceof InsufficientTeddyCoinsError) return res.status(409).json({ success: false, code: 'INSUFFICIENT_TEDDY_COINS', required: error.required, available: error.available });
    console.error('Game start failed:', error);
    return res.status(500).json({ success: false, error: 'Erro interno ao iniciar jogo.' });
  }
}
