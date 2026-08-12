import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import {
  completeGameSession, GameDomainError, getGameCatalog, getGameHistory,
  startGameSession, type CompleteGameInput,
} from '../services/gameService';
import { auditGameEvent } from '../utils/auditLog';

function errorResponse(res: Response, error: GameDomainError) {
  return res.status(error.status).json({ error: { code: error.code, message: error.message } });
}

function gameIdParam(req: AuthRequest) {
  const value = req.params.gameId;
  return Array.isArray(value) ? value[0] : value;
}

export async function listGames(_req: AuthRequest, res: Response) {
  return res.json({ success: true, games: getGameCatalog() });
}

export async function listGameHistory(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || page < 1 || limit < 1) {
    return res.status(400).json({ error: { code: 'INVALID_PAGINATION', message: 'Paginação inválida.' } });
  }
  const history = await getGameHistory(req.userId, page, limit);
  return res.json({ success: true,
    items: history.items.map((session) => ({
      id: session.id, game_id: session.gameId, status: session.status, score: session.score,
      reward: session.coinsEarned, started_at: session.startedAt, finished_at: session.finishedAt,
    })),
    pagination: history.pagination,
  });
}

export async function startGame(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  const gameId = gameIdParam(req);
  try {
    const result = await startGameSession(req.userId, gameId);
    auditGameEvent('GAME_STARTED', { userId: req.userId, gameId, sessionId: result.session.id });
    return res.status(201).json({ success: true,
      session: {
        id: result.session.id, token: result.token, game_id: result.session.gameId,
        started_at: result.session.startedAt, expires_at: result.session.expiresAt, status: result.session.status,
      },
      entry_cost: 0, daily_remaining: result.remaining, teddy_coins: result.teddyCoins,
    });
  } catch (error) {
    if (error instanceof GameDomainError) return errorResponse(res, error);
    console.error('Game start failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno ao iniciar jogo.' } });
  }
}

export async function completeGame(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Autenticação obrigatória.' } });
  const gameId = gameIdParam(req);
  const input: CompleteGameInput = {
    sessionId: typeof req.body?.session_id === 'string' ? req.body.session_id : '',
    sessionToken: typeof req.body?.session_token === 'string' ? req.body.session_token : '',
    durationMs: req.body?.duration_ms,
    score: req.body?.score,
    events: req.body?.events,
  };
  try {
    const result = await completeGameSession(req.userId, gameId, input);
    auditGameEvent('GAME_COMPLETED', { userId: req.userId, gameId, sessionId: result.session.id });
    return res.json({ success: true,
      session: { id: result.session.id, game_id: result.session.gameId, status: result.session.status, score: result.session.score },
      reward: result.reward, teddy_coins: result.teddyCoins, idempotent: result.idempotent,
    });
  } catch (error) {
    if (error instanceof GameDomainError) {
      if (input.sessionId && error.status === 422) auditGameEvent('GAME_REJECTED', { userId: req.userId, gameId, sessionId: input.sessionId, reason: error.code });
      return errorResponse(res, error);
    }
    console.error('Game completion failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno ao concluir jogo.' } });
  }
}
