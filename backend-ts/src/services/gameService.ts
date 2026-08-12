import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from '../config/prisma';
import { getGameDefinition, listActiveGames, type GameEventType } from '../constants/gameCatalog';
import { creditTeddyCoinsInTransaction } from './teddyCoinService';

export const GAME_ENTRY_COST = 0;
export const GAMES_TIME_ZONE = 'America/Manaus';

export type GameEvent = { sequence: number; type: GameEventType; occurred_at_ms: number };
export type CompleteGameInput = {
  sessionId: string;
  sessionToken: string;
  durationMs: number;
  score: number;
  events: GameEvent[];
};

export class GameDomainError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) { super(message); }
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function safeTokenMatches(token: string, expectedHash: string | null) {
  if (!expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash) || token.length < 32 || token.length > 256) return false;
  const supplied = Buffer.from(tokenHash(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function resultHash(input: CompleteGameInput) {
  return createHash('sha256').update(JSON.stringify({
    duration_ms: input.durationMs,
    score: input.score,
    events: input.events,
  })).digest('hex');
}

function localDayStart(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GAMES_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  // America/Manaus is UTC-4 without daylight saving time.
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), 4));
}

export function validateGameResult(gameId: string, input: CompleteGameInput) {
  const game = getGameDefinition(gameId);
  if (!game?.active) throw new GameDomainError('GAME_NOT_FOUND', 404, 'Jogo não encontrado.');
  if (!input.sessionId || !input.sessionToken) throw new GameDomainError('INVALID_PAYLOAD', 400, 'Sessão e token são obrigatórios.');
  if (!Number.isSafeInteger(input.durationMs) || input.durationMs < game.minimumDurationMs || input.durationMs > game.maximumDurationMs) {
    throw new GameDomainError('IMPOSSIBLE_DURATION', 422, 'Duração incompatível com as regras do jogo.');
  }
  if (!Number.isSafeInteger(input.score) || input.score < 0 || input.score > game.maximumScore) {
    throw new GameDomainError('IMPOSSIBLE_SCORE', 422, 'Pontuação incompatível com as regras do jogo.');
  }
  if (!Array.isArray(input.events) || input.events.length > game.maximumEvents) {
    throw new GameDomainError('IMPOSSIBLE_EVENTS', 422, 'Quantidade de eventos incompatível com as regras do jogo.');
  }

  let calculatedScore = 0;
  let previousTime = -game.minimumEventIntervalMs;
  input.events.forEach((event, index) => {
    if (!event || event.sequence !== index + 1 || !['COIN_TAP', 'OBSTACLE_TAP'].includes(event.type)) {
      throw new GameDomainError('INVALID_EVENT_SEQUENCE', 422, 'Sequência de eventos inválida.');
    }
    if (!Number.isSafeInteger(event.occurred_at_ms) || event.occurred_at_ms < 0 || event.occurred_at_ms > input.durationMs) {
      throw new GameDomainError('IMPOSSIBLE_EVENT_TIME', 422, 'Tempo de evento inválido.');
    }
    if (event.occurred_at_ms - previousTime < game.minimumEventIntervalMs) {
      throw new GameDomainError('IMPOSSIBLE_EVENT_RATE', 422, 'Frequência de eventos impossível.');
    }
    previousTime = event.occurred_at_ms;
    calculatedScore = Math.max(0, calculatedScore + (event.type === 'COIN_TAP' ? 1 : -1));
  });
  if (calculatedScore !== input.score) throw new GameDomainError('SCORE_MISMATCH', 422, 'Pontuação não corresponde aos eventos.');

  return {
    game,
    calculatedScore,
    reward: Math.min(game.maximumReward, calculatedScore * game.coinsPerScore),
    resultHash: resultHash(input),
  };
}

export function getGameCatalog() {
  return listActiveGames().map((game) => ({
    id: game.id,
    name: game.name,
    duration_ms: game.durationMs,
    daily_limit: game.dailySessionLimit,
    maximum_score: game.maximumScore,
    maximum_reward: game.maximumReward,
    entry_cost: 0,
  }));
}

export async function startGameSession(userId: string, gameId: string, now = new Date()) {
  const game = getGameDefinition(gameId);
  if (!game?.active) throw new GameDomainError('GAME_NOT_FOUND', 404, 'Jogo não encontrado.');
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + game.sessionTtlMs);
  const dayStart = localDayStart(now);

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:${gameId}:${dayStart.toISOString()}`}))`;
    await tx.gameSession.updateMany({
      where: { userId, status: 'STARTED', expiresAt: { lte: now } },
      data: { status: 'EXPIRED', finishedAt: now },
    });
    const used = await tx.gameSession.count({ where: { userId, gameId, startedAt: { gte: dayStart, lte: now } } });
    if (used >= game.dailySessionLimit) throw new GameDomainError('DAILY_LIMIT_REACHED', 429, 'Limite diário de partidas atingido.');
    const session = await tx.gameSession.create({
      data: { userId, gameId, tokenHash: tokenHash(token), expiresAt, startedAt: now },
    });
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { teddyCoins: true } });
    return { session, teddyCoins: user.teddyCoins, remaining: game.dailySessionLimit - used - 1 };
  });
  return { ...result, token };
}

export async function completeGameSession(userId: string, gameId: string, input: CompleteGameInput, now = new Date()) {
  const existing = await prisma.gameSession.findUnique({ where: { id: input.sessionId } });
  if (!existing || existing.gameId !== gameId) throw new GameDomainError('SESSION_NOT_FOUND', 404, 'Sessão não encontrada.');
  if (existing.userId !== userId) throw new GameDomainError('SESSION_FORBIDDEN', 403, 'Sessão pertence a outro usuário.');
  if (!safeTokenMatches(input.sessionToken, existing.tokenHash)) throw new GameDomainError('INVALID_SESSION_TOKEN', 401, 'Token da sessão inválido.');

  let validated: ReturnType<typeof validateGameResult>;
  try {
    validated = validateGameResult(gameId, input);
  } catch (error) {
    if (error instanceof GameDomainError && existing.status === 'STARTED') await rejectGameSession(userId, existing.id, error.code, now);
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.sessionId}))`;
    const session = await tx.gameSession.findUnique({ where: { id: input.sessionId } });
    if (!session || session.gameId !== gameId || session.userId !== userId) throw new GameDomainError('SESSION_NOT_FOUND', 404, 'Sessão não encontrada.');

    if (session.status === 'COMPLETED') {
      if (session.resultHash !== validated.resultHash) throw new GameDomainError('COMPLETION_PAYLOAD_CONFLICT', 409, 'A sessão já foi concluída com outro resultado.');
      const movement = await tx.teddyCoinTransaction.findUnique({
        where: { userId_type_referenceId: { userId, type: 'GAME_REWARD', referenceId: session.id } },
      });
      const wallet = movement ?? await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { teddyCoins: true } });
      return { state: 'completed' as const, session, reward: session.coinsEarned, teddyCoins: 'balanceAfter' in wallet ? wallet.balanceAfter : wallet.teddyCoins, idempotent: true };
    }
    if (session.status !== 'STARTED') throw new GameDomainError('SESSION_UNAVAILABLE', 409, 'Sessão não está disponível para conclusão.');
    if (!session.expiresAt || session.expiresAt <= now) {
      await tx.gameSession.update({ where: { id: session.id }, data: { status: 'EXPIRED', finishedAt: now } });
      return { state: 'expired' as const };
    }

    const completed = await tx.gameSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED', finishedAt: now, score: validated.calculatedScore,
        eventCount: input.events.length, resultHash: validated.resultHash,
        coinsEarned: validated.reward, won: validated.reward > 0,
      },
    });
    const movement = validated.reward > 0 ? await creditTeddyCoinsInTransaction(tx, {
      userId, amount: validated.reward, type: 'GAME_REWARD', source: 'GAME_SESSION', referenceId: session.id,
      description: `Recompensa do jogo ${gameId}`,
    }) : null;
    const user = movement ? null : await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { teddyCoins: true } });
    return { state: 'completed' as const, session: completed, reward: validated.reward, teddyCoins: movement?.balanceAfter ?? user!.teddyCoins, idempotent: false };
  });
  if (result.state === 'expired') throw new GameDomainError('SESSION_EXPIRED', 410, 'Sessão expirada.');
  return result;
}

export async function rejectGameSession(userId: string, sessionId: string, reason: string, now = new Date()) {
  await prisma.gameSession.updateMany({
    where: { id: sessionId, userId, status: 'STARTED' },
    data: { status: 'REJECTED', rejectedReason: reason, finishedAt: now },
  });
}

export async function getGameHistory(userId: string, page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const where = { userId };
  const [items, total] = await prisma.$transaction([
    prisma.gameSession.findMany({ where, orderBy: { startedAt: 'desc' }, skip: (safePage - 1) * safeLimit, take: safeLimit }),
    prisma.gameSession.count({ where }),
  ]);
  return { items, pagination: { page: safePage, limit: safeLimit, total, total_pages: Math.ceil(total / safeLimit) } };
}
